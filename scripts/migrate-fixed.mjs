/**
 * Crea la tabla de gastos fijos y enlaza los gastos generados desde ellos.
 * Uso: node scripts/migrate-fixed.mjs   (lee credenciales de .env.local)
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
  CREATE TABLE IF NOT EXISTS fixed_expenses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER NOT NULL,
    name           TEXT    NOT NULL,
    amount         REAL    NOT NULL,
    category       TEXT    NOT NULL,
    subcategory    TEXT,
    day_of_month   INTEGER NOT NULL DEFAULT 1,
    payment_method TEXT,
    active         INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT    NOT NULL
  )
`);
await db.execute(`CREATE INDEX IF NOT EXISTS idx_fixed_user ON fixed_expenses(user_id)`);
console.log("OK: tabla fixed_expenses lista");

// Columna que enlaza un gasto con el gasto fijo que lo generó
const cols = await db.execute("PRAGMA table_info(expenses)");
const yaExiste = cols.rows.some((r) => String(r.name) === "fixed_expense_id");

if (yaExiste) {
  console.log("OK: expenses.fixed_expense_id ya existía");
} else {
  await db.execute("ALTER TABLE expenses ADD COLUMN fixed_expense_id INTEGER");
  console.log("OK: columna expenses.fixed_expense_id añadida");
}

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos existentes intactos:", Number(t.rows[0].c));
