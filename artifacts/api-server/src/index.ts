import app from "./app";
import {
  closeDatabasePool,
  databasePoolConfig,
  ensureRuntimeSchema,
  pool,
} from "@workspace/db";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function main() {
  await ensureRuntimeSchema(pool);

  const server = app.listen(port, () => {
    logger.info(
      { port, databasePoolMax: databasePoolConfig.max },
      "Server listening",
    );
  });

  server.requestTimeout = 35_000;
  server.headersTimeout = 40_000;
  server.keepAliveTimeout = 65_000;

  let shuttingDown = false;
  async function shutdown(signal: string) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Graceful shutdown started");

    server.close(async (error) => {
      if (error) {
        logger.error({ error }, "HTTP server shutdown failed");
        process.exitCode = 1;
      }
      try {
        await closeDatabasePool();
      } catch (poolError) {
        logger.error({ poolError }, "Database pool shutdown failed");
        process.exitCode = 1;
      }
    });

    setTimeout(() => {
      logger.error("Graceful shutdown timed out");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

main().catch((error) => {
  logger.error({ error }, "Server startup failed");
  process.exit(1);
});
