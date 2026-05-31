/**
 * Migración de datos CSV → Turso
 * Uso: node scripts/migrate.mjs <turso-url> <turso-token> [csv-path]
 *
 * Ejemplo:
 *   node scripts/migrate.mjs \
 *     "libsql://income-tracker-xxx.turso.io" \
 *     "eyJhbGci..." \
 *     "scripts/data.csv"   ← opcional, por defecto usa scripts/data.csv
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";

const [,, tursoUrl, tursoToken, csvArg] = process.argv;

if (!tursoUrl || !tursoToken) {
  console.error("Uso: node scripts/migrate.mjs <turso-url> <turso-token> [csv-path]");
  process.exit(1);
}

const csvPath = resolve(csvArg ?? "scripts/data.csv");

// ── Parsear CSV ──────────────────────────────────────────────────
function parseMonto(raw) {
  // "$ 33.000,00" → 33000
  return parseFloat(
    raw.replace(/\$/g, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
  );
}

function parseFecha(raw) {
  // "31/05/2026" → "2026-05-31"
  const [d, m, y] = raw.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

console.log(`\n📂 Leyendo CSV: ${csvPath}`);
const raw = readFileSync(csvPath, "utf-8").replace(/^﻿/, ""); // strip BOM
const lines = raw.trim().split("\n").slice(1); // skip header

const incomes = [];
const expenses = [];

for (const line of lines) {
  const [tipo, fecha, categoria, subcategoria, descripcion, monto, metodoPago] =
    line.split(";").map((s) => s.trim());

  const row = {
    amount: parseMonto(monto),
    category: categoria || "General",
    subcategory: subcategoria || null,
    note: descripcion || null,
    date: parseFecha(fecha),
    created_at: new Date().toISOString(),
    payment_method: metodoPago || "Efectivo",
  };

  if (tipo === "ingreso") incomes.push(row);
  else if (tipo === "gasto") expenses.push(row);
}

console.log(`✓ Parseados: ${incomes.length} ingresos, ${expenses.length} gastos`);

// ── Validar números ──────────────────────────────────────────────
const invalid = [...incomes, ...expenses].filter((r) => isNaN(r.amount));
if (invalid.length) {
  console.error("❌ Filas con monto inválido:", invalid);
  process.exit(1);
}

// ── Conectar a Turso ─────────────────────────────────────────────
console.log(`\n🌐 Conectando a Turso: ${tursoUrl}`);
const db = createClient({ url: tursoUrl, authToken: tursoToken });

// ── Crear schema ─────────────────────────────────────────────────
console.log("🏗  Creando schema...");
const statements = [
  `CREATE TABLE IF NOT EXISTS incomes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    subcategory TEXT,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'General',
    subcategory TEXT,
    note TEXT,
    date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    payment_method TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    target REAL NOT NULL,
    saved REAL NOT NULL DEFAULT 0,
    emoji TEXT DEFAULT '🎯',
    created_at TEXT NOT NULL,
    completed INTEGER DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL UNIQUE,
    amount REAL NOT NULL
  )`,
];

for (const stmt of statements) {
  await db.execute(stmt);
}
console.log("✓ Schema OK");

// ── Insertar ingresos ────────────────────────────────────────────
console.log(`\n💰 Insertando ${incomes.length} ingresos...`);
for (const r of incomes) {
  await db.execute(
    "INSERT INTO incomes (amount,category,subcategory,note,date,created_at) VALUES (?,?,?,?,?,?)",
    [r.amount, r.category, r.subcategory, r.note, r.date, r.created_at]
  );
}
console.log(`✓ ${incomes.length} ingresos insertados`);

// ── Insertar gastos ──────────────────────────────────────────────
console.log(`\n💸 Insertando ${expenses.length} gastos...`);
for (const r of expenses) {
  await db.execute(
    "INSERT INTO expenses (amount,category,subcategory,note,date,created_at,payment_method) VALUES (?,?,?,?,?,?,?)",
    [r.amount, r.category, r.subcategory, r.note, r.date, r.created_at, r.payment_method]
  );
}
console.log(`✓ ${expenses.length} gastos insertados`);

// ── Verificación ─────────────────────────────────────────────────
console.log("\n📊 Verificación final:");
const vi = await db.execute("SELECT COUNT(*) as n FROM incomes");
const ve = await db.execute("SELECT COUNT(*) as n FROM expenses");
console.log(`   Ingresos en Turso: ${vi.rows[0].n}`);
console.log(`   Gastos en Turso:   ${ve.rows[0].n}`);
console.log("\n✅ Migración completada. Listo para deploy en Vercel.");
