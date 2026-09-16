/**
 * Medios de pago editables por usuario (nombre, emoji, nombre corto, tipo y
 * últimos 4 dígitos opcionales).
 * Uso: node scripts/migrate-payment-methods.mjs   (lee credenciales de .env.local)
 * Es idempotente. No copia datos: cada usuario se siembra solo la primera vez
 * que abre el dashboard (lib/paymentMethods.ts), conservando los nombres que
 * ya aparezcan en sus gastos.
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
  CREATE TABLE IF NOT EXISTS payment_methods (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL,
    name       TEXT    NOT NULL,
    emoji      TEXT    NOT NULL DEFAULT '💳',
    short      TEXT    NOT NULL,
    kind       TEXT    NOT NULL DEFAULT 'otro' CHECK (kind IN ('efectivo','debito','credito','otro')),
    last4      TEXT,
    position   INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL,
    UNIQUE (user_id, name)
  )
`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_payment_methods_user ON payment_methods(user_id, position)`);
console.log("OK: tabla payment_methods lista");

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos existentes intactos:", Number(t.rows[0].c));
