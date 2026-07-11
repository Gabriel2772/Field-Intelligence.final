import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, idempotencyKeysTable } from "@workspace/db";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const KEY_PATTERN = /^[a-zA-Z0-9._:-]{8,128}$/;
const TTL_MS = 24 * 60 * 60 * 1000;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizedPath(req: Request): string {
  return req.baseUrl + req.path;
}

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!MUTATING_METHODS.has(req.method)) {
    next();
    return;
  }

  const key = req.header("Idempotency-Key");
  if (!key) {
    next();
    return;
  }

  if (!KEY_PATTERN.test(key)) {
    res.status(400).json({
      error:
        "Idempotency-Key must contain 8-128 letters, numbers, dots, colons, underscores or hyphens.",
    });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  const path = normalizedPath(req);
  const requestHash = sha256(JSON.stringify(req.body ?? null));
  const fingerprint = sha256(`${userId}:${req.method}:${path}:${key}`);
  const expiresAt = new Date(Date.now() + TTL_MS);

  const [claimed] = await db
    .insert(idempotencyKeysTable)
    .values({
      fingerprint,
      userId,
      method: req.method,
      path,
      requestHash,
      expiresAt,
    })
    .onConflictDoNothing()
    .returning();

  if (!claimed) {
    const [existing] = await db
      .select()
      .from(idempotencyKeysTable)
      .where(
        and(
          eq(idempotencyKeysTable.fingerprint, fingerprint),
          eq(idempotencyKeysTable.userId, userId),
        ),
      );

    if (!existing) {
      res.status(409).json({ error: "Idempotency state unavailable; retry." });
      return;
    }

    if (existing.requestHash !== requestHash) {
      res.status(409).json({
        error: "Idempotency-Key was already used with a different payload.",
      });
      return;
    }

    if (existing.statusCode == null) {
      res.setHeader("Retry-After", "1");
      res.status(409).json({ error: "Equivalent operation is still running." });
      return;
    }

    res.setHeader("Idempotency-Replayed", "true");
    res.status(existing.statusCode).json(existing.responseBody ?? null);
    return;
  }

  let jsonIntercepted = false;
  const originalJson = res.json.bind(res);

  res.json = ((body: unknown) => {
    if (jsonIntercepted) return res;
    jsonIntercepted = true;

    const statusCode = res.statusCode;
    if (statusCode >= 500) {
      void db
        .delete(idempotencyKeysTable)
        .where(eq(idempotencyKeysTable.fingerprint, fingerprint));
      return originalJson(body);
    }

    void db
      .update(idempotencyKeysTable)
      .set({
        statusCode,
        responseBody: body as Record<string, unknown> | null,
      })
      .where(eq(idempotencyKeysTable.fingerprint, fingerprint))
      .then(() => {
        originalJson(body);
      })
      .catch(async (error) => {
        req.log.error({ error }, "Failed to persist idempotent response");
        await db
          .delete(idempotencyKeysTable)
          .where(eq(idempotencyKeysTable.fingerprint, fingerprint))
          .catch(() => undefined);

        if (!res.headersSent) {
          res.status(503);
          originalJson({ error: "Operation result could not be persisted; retry." });
        }
      });

    return res;
  }) as Response["json"];

  res.once("finish", () => {
    if (jsonIntercepted) return;

    if (res.statusCode >= 500) {
      void db
        .delete(idempotencyKeysTable)
        .where(eq(idempotencyKeysTable.fingerprint, fingerprint));
      return;
    }

    void db
      .update(idempotencyKeysTable)
      .set({
        statusCode: res.statusCode,
        responseBody: null,
      })
      .where(eq(idempotencyKeysTable.fingerprint, fingerprint));
  });

  next();
}
