/**
 * Crea la tabla de recibos escaneados (foto + datos extraídos por IA).
 * Uso: node scripts/migrate-receipts.mjs   (lee credenciales de .env.local)
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
  CREATE TABLE IF NOT EXISTS receipts (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL,
    expense_id   INTEGER,
    image_url    TEXT    NOT NULL,
    proveedor    TEXT,
    nit          TEXT,
    valor        REAL,
    correo       TEXT,
    telefono     TEXT,
    fecha        TEXT,
    categoria    TEXT,
    raw_ai_json  TEXT,
    created_at   TEXT    NOT NULL
  )
`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id)`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_receipts_expense ON receipts(expense_id)`);
console.log("OK: tabla receipts lista");

const t = await db.execute("SELECT COUNT(*) c FROM receipts");
console.log("Recibos existentes:", Number(t.rows[0].c));
