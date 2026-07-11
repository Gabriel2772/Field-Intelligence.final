import pg from "pg";

const { Pool } = pg;
const DATABASE_URL = process.env.DATABASE_URL;
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:8080";

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new Pool({ connectionString: DATABASE_URL, max: 4 });
const today = new Date().toISOString().slice(0, 10);
const adminSid = "ci-auditor-session";
const viewerSid = "ci-viewer-session";

function session(userId, role) {
  return JSON.stringify({
    user: {
      id: userId,
      isAuthenticated: true,
      email: `${userId}@example.invalid`,
      firstName: "CI",
      lastName: role,
      profileImage: null,
      role,
    },
    access_token: "ci-only",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
  });
}

async function seed() {
  await pool.query(
    `insert into users (id, email, first_name, last_name, role)
     values
       ('ci-auditor', 'ci-auditor@example.invalid', 'CI', 'Auditor', 'auditor'),
       ('ci-viewer', 'ci-viewer@example.invalid', 'CI', 'Viewer', 'viewer')
     on conflict (id) do update set role = excluded.role`,
  );
  await pool.query(
    `insert into sessions (sid, sess, expire)
     values ($1, $2::jsonb, now() + interval '1 hour'),
            ($3, $4::jsonb, now() + interval '1 hour')
     on conflict (sid) do update set sess = excluded.sess, expire = excluded.expire`,
    [adminSid, session("ci-auditor", "auditor"), viewerSid, session("ci-viewer", "viewer")],
  );
  const result = await pool.query(
    `insert into obras (nome, codigo, status)
     values ('CI Load Test', 'CI-LOAD', 'ativo')
     on conflict (codigo) do update set nome = excluded.nome
     returning id`,
  );
  return Number(result.rows[0].id);
}

async function waitForApi() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/healthz`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("API did not become healthy");
}

function percentile(values, percentileValue) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, index)];
}

async function readOnce() {
  const started = performance.now();
  const response = await fetch(`${BASE_URL}/api/dashboard/summary`, {
    headers: {
      Cookie: `sid=${adminSid}`,
      "X-Viewport-Class": "mobile",
      "X-Pointer-Type": "coarse",
      "X-Display-Mode": "standalone",
    },
  });
  const duration = performance.now() - started;
  if (!response.ok) throw new Error(`Read failed with ${response.status}`);
  await response.json();
  return duration;
}

async function concurrentReads(workers, iterations) {
  const durations = [];
  let failures = 0;
  await Promise.all(
    Array.from({ length: workers }, async () => {
      for (let i = 0; i < iterations; i += 1) {
        try {
          durations.push(await readOnce());
        } catch {
          failures += 1;
        }
      }
    }),
  );
  return { durations, failures };
}

async function idempotencyProbe(obraId) {
  const key = `ci-idempotency-${Date.now()}`;
  const marker = `ci-concurrency-${Date.now()}`;
  const body = JSON.stringify({
    obra_id: obraId,
    visitante: "CI concurrency",
    data_visita: today,
    observacoes: marker,
    status: "pendente",
  });
  const headers = {
    Cookie: `sid=${adminSid}`,
    "Content-Type": "application/json",
    "Idempotency-Key": key,
  };

  const responses = await Promise.all(
    Array.from({ length: 20 }, () =>
      fetch(`${BASE_URL}/api/visitas`, { method: "POST", headers, body }),
    ),
  );
  const accepted = responses.filter((response) => response.status === 201).length;
  const inProgress = responses.filter((response) => response.status === 409).length;
  if (accepted < 1 || accepted + inProgress !== responses.length) {
    throw new Error(`Unexpected idempotency statuses: accepted=${accepted}, conflict=${inProgress}`);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  const replay = await fetch(`${BASE_URL}/api/visitas`, {
    method: "POST",
    headers,
    body,
  });
  if (replay.status !== 201 || replay.headers.get("idempotency-replayed") !== "true") {
    throw new Error("Completed idempotent replay did not return the original response");
  }

  const count = await pool.query(
    "select count(*)::int as count from visitas where observacoes = $1",
    [marker],
  );
  if (Number(count.rows[0].count) !== 1) {
    throw new Error(`Idempotency created ${count.rows[0].count} rows instead of one`);
  }
}

async function roleProbe(obraId) {
  const response = await fetch(`${BASE_URL}/api/visitas`, {
    method: "POST",
    headers: {
      Cookie: `sid=${viewerSid}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `ci-viewer-${Date.now()}`,
    },
    body: JSON.stringify({
      obra_id: obraId,
      visitante: "CI viewer",
      data_visita: today,
      status: "pendente",
    }),
  });
  if (response.status !== 403) {
    throw new Error(`Viewer write returned ${response.status}, expected 403`);
  }
}

try {
  await waitForApi();
  const obraId = await seed();
  await readOnce();

  const baseline = await concurrentReads(20, 20);
  const burst = await concurrentReads(40, 5);
  const durations = [...baseline.durations, ...burst.durations];
  const failures = baseline.failures + burst.failures;
  const total = durations.length + failures;
  const errorRate = total ? failures / total : 1;
  const p95 = percentile(durations, 95);

  if (errorRate >= 0.01) throw new Error(`Read error rate ${errorRate} exceeds 1%`);
  if (p95 >= 500) throw new Error(`Read p95 ${p95.toFixed(1)}ms exceeds 500ms`);

  await idempotencyProbe(obraId);
  await roleProbe(obraId);

  console.log(
    JSON.stringify({
      baselineRequests: baseline.durations.length,
      burstRequests: burst.durations.length,
      failures,
      errorRate,
      p95ReadMs: Number(p95.toFixed(1)),
      idempotency: "passed",
      viewerWriteGuard: "passed",
    }),
  );
} finally {
  await pool.end();
}
