/**
 * Categorías editables por usuario (nombre, ícono, color, subcategorías).
 * Uso: node scripts/migrate-categories.mjs   (lee credenciales de .env.local)
 * Es idempotente. No copia datos: cada usuario se siembra solo la primera vez
 * que abre el dashboard (lib/categories.ts).
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
  CREATE TABLE IF NOT EXISTS categories (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    tipo           TEXT    NOT NULL CHECK (tipo IN ('gasto', 'ingreso')),
    name           TEXT    NOT NULL,
    grupo          TEXT    NOT NULL DEFAULT '',
    icon           TEXT    NOT NULL,
    color          TEXT    NOT NULL,
    subcategories  TEXT    NOT NULL DEFAULT '[]',
    position       INTEGER NOT NULL DEFAULT 0,
    created_at     TEXT    NOT NULL,
    UNIQUE (user_id, tipo, name)
  )
`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id, tipo, position)`);
console.log("OK: tabla categories lista");

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos existentes intactos:", Number(t.rows[0].c));
