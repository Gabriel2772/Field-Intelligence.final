import http from "k6/http";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const BASE_URL = (__ENV.BASE_URL || "http://localhost:8080").replace(/\/$/, "");
const SESSION_COOKIE = __ENV.SESSION_COOKIE || "";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";
const WRITE_TEST_ENABLED = __ENV.WRITE_TEST_ENABLED === "true";
const TEST_OBRA_ID = Number(__ENV.TEST_OBRA_ID || "0");

const unexpectedErrors = new Rate("unexpected_errors");
const readDuration = new Trend("read_duration", true);
const writeDuration = new Trend("write_duration", true);

export const options = {
  scenarios: {
    baseline: {
      executor: "constant-vus",
      vus: 20,
      duration: "15m",
      gracefulStop: "30s",
    },
    burst: {
      executor: "constant-vus",
      vus: 40,
      duration: "2m",
      startTime: "15m30s",
      gracefulStop: "30s",
    },
  },
  thresholds: {
    unexpected_errors: ["rate<0.01"],
    read_duration: ["p(95)<500"],
    write_duration: ["p(95)<900"],
    http_req_failed: ["rate<0.01"],
  },
};

function headers(extra = {}) {
  const result = {
    Accept: "application/json",
    "X-Viewport-Class": __ENV.VIEWPORT_CLASS || "mobile",
    "X-Pointer-Type": __ENV.POINTER_TYPE || "coarse",
    "X-Display-Mode": __ENV.DISPLAY_MODE || "standalone",
    ...extra,
  };
  if (SESSION_COOKIE) result.Cookie = `sid=${SESSION_COOKIE}`;
  if (AUTH_TOKEN) result.Authorization = `Bearer ${AUTH_TOKEN}`;
  return result;
}

function get(path) {
  const response = http.get(`${BASE_URL}${path}`, { headers: headers() });
  readDuration.add(response.timings.duration);
  const ok = check(response, {
    [`GET ${path} returns 200`]: (r) => r.status === 200,
  });
  unexpectedErrors.add(!ok);
  return response;
}

function writeProbe() {
  if (!WRITE_TEST_ENABLED || !TEST_OBRA_ID) return;

  const idempotencyKey = `k6-${__VU}-${__ITER}-${Date.now()}`;
  const payload = JSON.stringify({
    obra_id: TEST_OBRA_ID,
    visitante: `k6-vu-${__VU}`,
    data_visita: new Date().toISOString().slice(0, 10),
    observacoes: "Registro criado exclusivamente em banco descartável de carga.",
    status: "pendente",
  });
  const requestHeaders = headers({
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
  });

  const first = http.post(`${BASE_URL}/api/visitas`, payload, {
    headers: requestHeaders,
  });
  writeDuration.add(first.timings.duration);
  const firstOk = check(first, {
    "write probe is accepted": (r) => r.status === 201,
  });
  unexpectedErrors.add(!firstOk);

  const replay = http.post(`${BASE_URL}/api/visitas`, payload, {
    headers: requestHeaders,
  });
  writeDuration.add(replay.timings.duration);
  const replayOk = check(replay, {
    "idempotent replay returns original result": (r) =>
      r.status === 201 && r.headers["Idempotency-Replayed"] === "true",
    "idempotent replay keeps same entity": (r) => {
      try {
        return JSON.parse(first.body).id === JSON.parse(r.body).id;
      } catch {
        return false;
      }
    },
  });
  unexpectedErrors.add(!replayOk);
}

export default function () {
  const roll = Math.random();

  if (roll < 0.6) {
    group("operational reads", () => {
      get("/api/dashboard/summary");
      get("/api/obras");
    });
  } else if (roll < 0.85) {
    group("field reads", () => {
      get("/api/visitas");
      get("/api/rncs");
    });
  } else if (roll < 0.95) {
    group("reconnection burst", () => {
      get("/api/ativos");
      get("/api/compromissos");
      writeProbe();
    });
  } else {
    group("idempotent write", writeProbe);
  }

  sleep(Math.random() * 1.5 + 0.25);
}
