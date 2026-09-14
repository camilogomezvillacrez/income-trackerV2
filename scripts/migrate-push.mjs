/**
 * Suscripciones de notificaciones push (una por dispositivo).
 * Uso: node scripts/migrate-push.mjs   (lee credenciales de .env.local)
 * Es idempotente: se puede correr varias veces.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    endpoint    TEXT    PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    p256dh      TEXT    NOT NULL,
    auth        TEXT    NOT NULL,
    created_at  TEXT    NOT NULL
  )
`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id)`);
console.log("OK: tabla push_subscriptions lista");
