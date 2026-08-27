/**
 * Crea las tablas de deudas.
 * Uso: node scripts/migrate-debts.mjs
 * (Lee las credenciales de .env.local)
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
  `CREATE TABLE IF NOT EXISTS debts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL,
    person      TEXT    NOT NULL,
    type        TEXT    NOT NULL,
    amount      REAL    NOT NULL,
    paid        REAL    NOT NULL DEFAULT 0,
    description TEXT,
    date        TEXT    NOT NULL,
    due_date    TEXT,
    completed   INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id)`,
  `CREATE TABLE IF NOT EXISTS debt_payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    debt_id    INTEGER NOT NULL,
    user_id    INTEGER NOT NULL,
    amount     REAL    NOT NULL,
    date       TEXT    NOT NULL,
    note       TEXT,
    created_at TEXT    NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_debt_payments_debt ON debt_payments(debt_id)`,
];

for (const s of statements) await db.execute(s);
console.log("OK: tablas debts y debt_payments listas");

const t = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
console.log("Tablas:", t.rows.map((r) => r.name).join(", "));
