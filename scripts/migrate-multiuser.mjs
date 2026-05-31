/**
 * Migración a multi-usuario en Turso.
 * Uso: node scripts/migrate-multiuser.mjs <turso-url> <turso-token> <email> <password>
 *
 * Crea la tabla users, añade user_id a todas las tablas existentes,
 * y registra al primer usuario (que hereda todos los datos actuales).
 */

import { createClient } from "@libsql/client";
import { hashSync } from "bcryptjs";

const [,, tursoUrl, tursoToken, email, password] = process.argv;

if (!tursoUrl || !tursoToken || !email || !password) {
  console.error("Uso: node scripts/migrate-multiuser.mjs <url> <token> <email> <password>");
  process.exit(1);
}

const db = createClient({ url: tursoUrl, authToken: tursoToken });

console.log("\n🔗 Conectado a Turso:", tursoUrl);

// 1. Crear tabla users
console.log("\n👤 Creando tabla users...");
await db.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    name          TEXT,
    created_at    TEXT    NOT NULL
  )
`);
console.log("✓ Tabla users OK");

// 2. Añadir user_id a cada tabla (con DEFAULT 1 para datos existentes)
const tables = ["incomes", "expenses", "goals", "budgets"];
console.log("\n🔧 Añadiendo columna user_id a las tablas existentes...");
for (const t of tables) {
  try {
    await db.execute(`ALTER TABLE ${t} ADD COLUMN user_id INTEGER NOT NULL DEFAULT 1`);
    console.log(`  ✓ ${t}.user_id añadida`);
  } catch (e) {
    if (String(e).includes("duplicate column")) {
      console.log(`  ⚠  ${t}.user_id ya existe — omitido`);
    } else {
      throw e;
    }
  }
}

// 3. Crear primer usuario (hereda los datos existentes que tienen user_id = 1)
console.log(`\n🔐 Creando usuario: ${email}`);
const hash = hashSync(password, 10);
try {
  await db.execute(
    "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
    [email, hash, email.split("@")[0], new Date().toISOString()]
  );
  const res = await db.execute("SELECT id FROM users WHERE email = ?", [email]);
  const userId = res.rows[0].id;
  console.log(`✓ Usuario creado con id=${userId}`);
  if (Number(userId) !== 1) {
    console.log(`⚠  El usuario tiene id=${userId} pero los datos existentes tienen user_id=1.`);
    console.log("   Actualizando datos existentes al user_id correcto...");
    for (const t of tables) {
      await db.execute(`UPDATE ${t} SET user_id = ? WHERE user_id = 1`, [userId]);
    }
    console.log("   ✓ Datos reasignados");
  }
} catch (e) {
  if (String(e).includes("UNIQUE constraint failed")) {
    console.log(`⚠  El usuario ${email} ya existe — omitido`);
  } else {
    throw e;
  }
}

// 4. Verificación final
console.log("\n📊 Verificación final:");
const u  = await db.execute("SELECT COUNT(*) as n FROM users");
const i  = await db.execute("SELECT COUNT(*) as n FROM incomes");
const ex = await db.execute("SELECT COUNT(*) as n FROM expenses");
console.log(`   Usuarios:  ${u.rows[0].n}`);
console.log(`   Ingresos:  ${i.rows[0].n}`);
console.log(`   Gastos:    ${ex.rows[0].n}`);
console.log("\n✅ Schema multi-usuario listo.");
