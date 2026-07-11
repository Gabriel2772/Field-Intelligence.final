import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const idempotencyKeysTable = pgTable(
  "idempotency_keys",
  {
    fingerprint: varchar("fingerprint", { length: 64 }).primaryKey(),
    userId: varchar("user_id").notNull(),
    method: varchar("method", { length: 10 }).notNull(),
    path: varchar("path", { length: 500 }).notNull(),
    requestHash: varchar("request_hash", { length: 64 }).notNull(),
    statusCode: integer("status_code"),
    responseBody: jsonb("response_body"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("IDX_idempotency_expires").on(table.expiresAt),
    index("IDX_idempotency_user").on(table.userId),
  ],
);
