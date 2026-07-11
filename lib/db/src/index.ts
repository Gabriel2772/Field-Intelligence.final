import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function envInt(name: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

const poolMax = envInt("DATABASE_POOL_MAX", 8, 2, 20);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
  idleTimeoutMillis: envInt("DATABASE_IDLE_TIMEOUT_MS", 30_000, 1_000, 120_000),
  connectionTimeoutMillis: envInt(
    "DATABASE_CONNECTION_TIMEOUT_MS",
    5_000,
    1_000,
    30_000,
  ),
  query_timeout: envInt("DATABASE_QUERY_TIMEOUT_MS", 20_000, 2_000, 120_000),
  statement_timeout: envInt(
    "DATABASE_STATEMENT_TIMEOUT_MS",
    15_000,
    2_000,
    120_000,
  ),
  keepAlive: true,
  application_name: "tequaly-field-intelligence",
});

pool.on("error", (error) => {
  console.error("Unexpected idle PostgreSQL client error", error);
});

export const db = drizzle(pool, { schema });

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}

export const databasePoolConfig = Object.freeze({
  max: poolMax,
});

export * from "./schema";

export { ensureRuntimeSchema } from "./runtime-migrations";
