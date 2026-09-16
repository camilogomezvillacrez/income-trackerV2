/**
 * Grupos de categorías (grupo > categoría > subcategoría) + subcategorías compactas.
 *
 *   node scripts/migrate-category-groups.mjs            -> agrega la columna 'grupo',
 *                                                          asigna grupos y crea las
 *                                                          categorías nuevas que falten.
 *                                                          Las subcategorías solo las
 *                                                          lista, no las toca.
 *   node scripts/migrate-category-groups.mjs --podar    -> además compacta las
 *                                                          subcategorías.
 *
 * Es idempotente. No borra categorías ni movimientos: al compactar solo se
 * eliminan subcategorías con CERO gastos y CERO gastos fijos asociados.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const PODAR = process.argv.includes("--podar");

const env = Object.fromEntries(
  readFileSync(".env.local", "utf-8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const db = createClient({ url: env.TURSO_DATABASE_URL, authToken: env.TURSO_AUTH_TOKEN });

// Espejo de constants/categories.ts en el momento de esta migración.
const GROUP_OF = {
  Vivienda: "Hogar y Servicios",
  Suscripciones: "Hogar y Servicios",
  "Alimentación": "Comida",
  Transporte: "Transporte",
  Salud: "Salud y Bienestar",
  Gym: "Salud y Bienestar",
  "Pólizas": "Salud y Bienestar",
  Entretenimiento: "Estilo de Vida",
  Ropa: "Estilo de Vida",
  "Cuidado personal": "Estilo de Vida",
  "Educación": "Estilo de Vida",
  "Tecnología": "Estilo de Vida",
  Mascotas: "Familia",
  Hijos: "Familia",
  Regalos: "Familia",
  Deudas: "Financiero",
  Ahorro: "Financiero",
};
const DEFAULT_GROUP = "Otros";

const NEW_CATS = {
  Gym:      { emoji: "💪", color: "#047857", subs: [["Mensualidad", "💪"], ["Suplementos", "🥤"]] },
  Mascotas: { emoji: "🐾", color: "#92400E", subs: [["Comida", "🦴"], ["Veterinario", "🩺"]] },
  Hijos:    { emoji: "🧒", color: "#C2410C", subs: [["Colegio", "🎒"], ["Clases", "🎨"], ["Ropa", "👕"]] },
  Regalos:  { emoji: "🎁", color: "#BE123C", subs: [] },
};

const SUB_EMOJIS = {
  Vivienda:        { Arriendo: "🏠", Servicios: "⚡", Internet: "📡", "Administración": "🏢" },
  Suscripciones:   { Streaming: "📺", Software: "💾", "Música": "🎵" },
  "Alimentación":  { Mercado: "🛒", Restaurante: "🍽️", Domicilio: "🛵", "Café": "☕" },
  Transporte:      { Gasolina: "⛽", "Uber/Taxi": "🚕", "Público": "🚌", Parqueadero: "🅿️" },
  Salud:           { "Médico": "🏥", Farmacia: "💊", Terapia: "🧠" },
  Gym:             { Mensualidad: "💪", Suplementos: "🥤" },
  Entretenimiento: { Salidas: "🎉", Cine: "🎬", Videojuegos: "🎮" },
  "Cuidado personal": { "Peluquería": "✂️", "Uñas": "💅", Skincare: "🧴" },
  Mascotas:        { Comida: "🦴", Veterinario: "🩺" },
  Hijos:           { Colegio: "🎒", Clases: "🎨", Ropa: "👕" },
};

/** Categorías que en el diseño nuevo no llevan subcategorías: el detalle va en la nota. */
const SIN_SUBS = ["Ropa", "Educación", "Tecnología", "Deudas", "Ahorro", "Pólizas"];

const KEEP_SUBS = {
  ...Object.fromEntries(Object.entries(SUB_EMOJIS).map(([cat, subs]) => [cat, Object.keys(subs)])),
  ...Object.fromEntries(SIN_SUBS.map((cat) => [cat, []])),
};

// 1. Columna grupo
const cols = await db.execute("PRAGMA table_info(categories)");
if (!cols.rows.some((r) => String(r.name) === "grupo")) {
  await db.execute("ALTER TABLE categories ADD COLUMN grupo TEXT NOT NULL DEFAULT ''");
  console.log("OK: columna 'grupo' agregada");
} else {
  console.log("OK: la columna 'grupo' ya existía");
}

// 2. Asignar grupo a las categorías de gasto que aún no lo tienen
const sinGrupo = await db.execute(
  "SELECT id, name FROM categories WHERE tipo='gasto' AND (grupo IS NULL OR grupo='')"
);
if (sinGrupo.rows.length) {
  await db.batch(
    sinGrupo.rows.map((r) => ({
      sql: "UPDATE categories SET grupo=? WHERE id=?",
      args: [GROUP_OF[String(r.name)] ?? DEFAULT_GROUP, Number(r.id)],
    })),
    "write"
  );
}
console.log(`OK: ${sinGrupo.rows.length} categorías agrupadas`);

// 3. Crear las categorías nuevas para quienes ya tenían sembradas las suyas
const users = await db.execute("SELECT DISTINCT user_id FROM categories");
const now = new Date().toISOString();
let creadas = 0;
for (const u of users.rows) {
  const uid = Number(u.user_id);
  const existing = await db.execute("SELECT name FROM categories WHERE user_id=? AND tipo='gasto'", [uid]);
  const names = new Set(existing.rows.map((r) => String(r.name)));
  const faltan = Object.entries(NEW_CATS).filter(([name]) => !names.has(name));
  if (!faltan.length) continue;
  await db.batch(
    faltan.map(([name, meta]) => ({
      sql: `INSERT OR IGNORE INTO categories (user_id, tipo, name, grupo, icon, color, subcategories, position, created_at)
            VALUES (?, 'gasto', ?, ?, ?, ?, ?,
              (SELECT COALESCE(MAX(position), -1) + 1 FROM categories WHERE user_id=? AND tipo='gasto'), ?)`,
      args: [
        uid, name, GROUP_OF[name] ?? DEFAULT_GROUP, `emoji:${meta.emoji}`, meta.color,
        JSON.stringify(meta.subs.map(([n, e]) => ({ name: n, emoji: e }))), uid, now,
      ],
    })),
    "write"
  );
  creadas += faltan.length;
}
console.log(`OK: ${creadas} categorías nuevas creadas (Gym, Mascotas, Hijos, Regalos)`);

// 4. Compactar subcategorías: quitar las que nadie usa y agregar las nuevas que falten
const cats = await db.execute("SELECT id, user_id, name, subcategories FROM categories WHERE tipo='gasto'");
let quitadas = 0;
let agregadas = 0;
const fuera = [];
const dentro = [];

for (const r of cats.rows) {
  const name = String(r.name);
  const keep = KEEP_SUBS[name];
  if (!keep) continue;

  let subs;
  try { subs = JSON.parse(String(r.subcategories ?? "[]")); } catch { continue; }
  if (!Array.isArray(subs)) continue;

  // Se quedan las que están en la lista nueva, y las que el usuario ya usó
  const sobreviven = [];
  for (const s of subs) {
    const sub = String(s?.name ?? "");
    if (!sub) continue;
    if (keep.includes(sub)) { sobreviven.push(s); continue; }
    const uso = await db.execute({
      sql: `SELECT (SELECT COUNT(*) FROM expenses WHERE user_id=? AND category=? AND subcategory=?)
                 + (SELECT COUNT(*) FROM fixed_expenses WHERE user_id=? AND category=? AND subcategory=?) AS n`,
      args: [Number(r.user_id), name, sub, Number(r.user_id), name, sub],
    });
    if (Number(uso.rows[0].n) > 0) sobreviven.push(s);
    else { quitadas++; fuera.push(`${name} › ${sub}`); }
  }

  // Y se agregan las de la lista compacta que todavía no existen
  const faltantes = keep
    .filter((k) => !sobreviven.some((s) => String(s?.name ?? "") === k))
    .map((k) => {
      agregadas++;
      dentro.push(`${name} › ${k}`);
      return { name: k, emoji: SUB_EMOJIS[name]?.[k] ?? "" };
    });

  // Orden final: primero la lista compacta, después lo propio del usuario que sigue en uso
  const final = [
    ...keep
      .map((k) => sobreviven.find((s) => String(s?.name ?? "") === k) ?? faltantes.find((f) => f.name === k))
      .filter(Boolean),
    ...sobreviven.filter((s) => !keep.includes(String(s?.name ?? ""))),
  ];

  if (PODAR && JSON.stringify(final) !== JSON.stringify(subs)) {
    await db.execute("UPDATE categories SET subcategories=? WHERE id=?", [JSON.stringify(final), Number(r.id)]);
  }
}

const resumen = [
  quitadas ? `${quitadas} subcategorías sin uso${PODAR ? " eliminadas" : " que se pueden quitar"}:\n  ${fuera.join("\n  ")}` : null,
  agregadas ? `${agregadas} subcategorías nuevas${PODAR ? " agregadas" : " que se pueden agregar"}:\n  ${dentro.join("\n  ")}` : null,
].filter(Boolean).join("\n\n");

if (!resumen) {
  console.log("OK: las subcategorías ya están compactadas");
} else if (PODAR) {
  console.log(`OK: subcategorías compactadas.\n\n${resumen}`);
} else {
  console.log(`\n${resumen}`);
  console.log("\nNo se tocó nada. Para aplicarlo: node scripts/migrate-category-groups.mjs --podar");
}

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos existentes intactos:", Number(t.rows[0].c));
