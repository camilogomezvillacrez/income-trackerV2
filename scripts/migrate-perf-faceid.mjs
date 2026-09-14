/**
 * Índices para que el dashboard no recorra tablas completas + tabla de
 * credenciales de Face ID (passkeys / WebAuthn).
 * Uso: node scripts/migrate-perf-faceid.mjs   (lee credenciales de .env.local)
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

const statements = [
  `CREATE INDEX IF NOT EXISTS idx_incomes_user_date  ON incomes(user_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_fixed     ON expenses(fixed_expense_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_user         ON goals(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_budgets_user       ON budgets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_debt_payments_user ON debt_payments(user_id)`,
  `CREATE TABLE IF NOT EXISTS webauthn_credentials (
    id          TEXT    PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    public_key  TEXT    NOT NULL,
    counter     INTEGER NOT NULL DEFAULT 0,
    transports  TEXT,
    created_at  TEXT    NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id)`,
];

for (const sql of statements) {
  await db.execute(sql);
  console.log("OK:", sql.split("\n")[0].replace(/\s+/g, " ").slice(0, 70));
}

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos existentes intactos:", Number(t.rows[0].c));
