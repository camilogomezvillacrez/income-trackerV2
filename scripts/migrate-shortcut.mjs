/**
 * Token por usuario para el atajo de Apple Wallet (se guarda solo el hash).
 * Uso: node scripts/migrate-shortcut.mjs   (lee credenciales de .env.local)
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

const cols = await db.execute("PRAGMA table_info(users)");
if (cols.rows.some((r) => String(r.name) === "shortcut_token_hash")) {
  console.log("OK: users.shortcut_token_hash ya existía");
} else {
  await db.execute("ALTER TABLE users ADD COLUMN shortcut_token_hash TEXT");
  console.log("OK: columna users.shortcut_token_hash añadida");
}

await db.execute(
  "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_shortcut_token ON users(shortcut_token_hash)"
);
console.log("OK: índice idx_users_shortcut_token");

const t = await db.execute("SELECT COUNT(*) c FROM users");
console.log("Usuarios intactos:", Number(t.rows[0].c));
