import pg from "pg";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  await pool.query(`
    drop table if exists idempotency_keys;
    alter table users drop column if exists role;
  `);
} finally {
  await pool.end();
}
