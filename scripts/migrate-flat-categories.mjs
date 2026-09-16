/**
 * Pasa de "grupo > categoría > subcategoría" a "grupo > categoría" (estilo Lukas).
 *
 * Las subcategorías que el usuario sí usaba ascienden a categoría propia, para
 * no perder el detalle: el 96% de los gastos tenía subcategoría y era ahí donde
 * estaba la información ("Domicilio" dice más que "Alimentación").
 *
 *   node scripts/migrate-flat-categories.mjs             -> solo muestra qué haría
 *   node scripts/migrate-flat-categories.mjs --aplicar   -> lo hace
 *
 * Nada se borra a ciegas: una categoría vieja solo se elimina cuando ya no le
 * queda ningún gasto, gasto fijo ni presupuesto apuntando.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const APLICAR = process.argv.includes("--aplicar");

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

// ── Espejo de constants/categories.ts ────────────────────────────────────────
const GRUPOS = [
  ["Comida y Bebida",   ["Mercado", "Restaurantes", "Domicilios"]],
  ["Estilo de Vida",    ["Cuidado Personal", "Educación", "Entretenimiento", "GYM", "Ropa", "Salud", "Suplementos", "Tecnología"]],
  ["Familia",           ["Hijos", "Mascotas", "Regalos"]],
  ["Hogar y Servicios", ["Arriendo", "Servicios", "Suscripciones"]],
  ["Otros",             ["Deudas", "Pólizas", "Innecesario", "Ahorro"]],
  ["Transporte",        ["Gasolina", "Transporte"]],
];

const META = {
  Mercado:            { emoji: "🛒", color: "#B45309" },
  Restaurantes:       { emoji: "🍽️", color: "#C2410C" },
  Domicilios:         { emoji: "🛵", color: "#EA580C" },
  "Cuidado Personal": { emoji: "💅", color: "#BE185D" },
  "Educación":        { emoji: "📚", color: "#6D28D9" },
  Entretenimiento:    { emoji: "🎬", color: "#7C3AED" },
  GYM:                { emoji: "💪", color: "#047857" },
  Ropa:               { emoji: "👕", color: "#065F46" },
  Salud:              { emoji: "❤️", color: "#9D174D" },
  Suplementos:        { emoji: "🥤", color: "#059669" },
  "Tecnología":       { emoji: "💻", color: "#0369A1" },
  Hijos:              { emoji: "🧒", color: "#D97706" },
  Mascotas:           { emoji: "🐾", color: "#92400E" },
  Regalos:            { emoji: "🎁", color: "#BE123C" },
  Arriendo:           { emoji: "🏠", color: "#1D4ED8" },
  Servicios:          { emoji: "⚡", color: "#2563EB" },
  Suscripciones:      { emoji: "🔄", color: "#4F46E5" },
  Deudas:             { emoji: "💳", color: "#991B1B" },
  "Pólizas":          { emoji: "🛡️", color: "#0C4A6E" },
  Innecesario:        { emoji: "🍸", color: "#6B7280" },
  Ahorro:             { emoji: "🐷", color: "#374151" },
  Gasolina:           { emoji: "⛽", color: "#0369A1" },
  Transporte:         { emoji: "🚗", color: "#0EA5E9" },
};

const NUEVAS = GRUPOS.flatMap(([, cats]) => cats);
const GRUPO_DE = Object.fromEntries(GRUPOS.flatMap(([g, cats]) => cats.map((c) => [c, g])));

/**
 * (categoría vieja, subcategoría) -> categoría nueva. "*" es el comodín cuando
 * la subcategoría no está listada o viene vacía.
 */
const MAPA = {
  Vivienda:           { Arriendo: "Arriendo", "*": "Servicios" },
  "Alimentación":     { Mercado: "Mercado", Restaurante: "Restaurantes", Desayuno: "Restaurantes", "Café": "Restaurantes", Domicilio: "Domicilios", "*": "Mercado" },
  Transporte:         { Gasolina: "Gasolina", "*": "Transporte" },
  Salud:              { Gym: "GYM", "*": "Salud" },
  Gym:                { Suplementos: "Suplementos", "*": "GYM" },
  "Pólizas":          { "*": "Pólizas" },
  Entretenimiento:    { "*": "Entretenimiento" },
  Ropa:               { "*": "Ropa" },
  "Cuidado personal": { "*": "Cuidado Personal" },
  "Educación":        { "*": "Educación" },
  // El software sube a Suscripciones; lo demás (un celular, un computador)
  // se queda en Tecnología, que el bucle de identidad le pone de comodín.
  "Tecnología":       { Software: "Suscripciones" },
  Suscripciones:      { "*": "Suscripciones" },
  Mascotas:           { "*": "Mascotas" },
  Hijos:              { "*": "Hijos" },
  Regalos:            { "*": "Regalos" },
  Deudas:             { "*": "Deudas" },
  Ahorro:             { "*": "Ahorro" },
  Innecesario:        { "*": "Innecesario" },
  General:            { "*": "Innecesario" },
  "Gastos hormiga":   { Snack: "Mercado", "Café": "Restaurantes", Propina: "Restaurantes", Recarga: "Servicios", Parqueadero: "Transporte", Innecesario: "Innecesario", "*": "Innecesario" },
};
// Las que ya son nuevas se quedan donde están (para poder correrlo dos veces)
for (const n of NUEVAS) MAPA[n] = { ...(MAPA[n] ?? {}), "*": n };

/** Devuelve la categoría nueva, o null si no sabemos y hay que avisar. */
function destino(cat, sub) {
  const reglas = MAPA[cat];
  if (!reglas) return null;
  const s = (sub ?? "").trim();
  return reglas[s] ?? reglas["*"] ?? null;
}

// ── Recorrido ────────────────────────────────────────────────────────────────
const users = await db.execute(
  `SELECT DISTINCT user_id FROM expenses
   UNION SELECT DISTINCT user_id FROM categories
   UNION SELECT DISTINCT user_id FROM fixed_expenses`
);

const now = new Date().toISOString();
let movidos = 0, fijos = 0, creadas = 0, borradas = 0;
const sinMapear = [];
const detalle = [];

for (const u of users.rows) {
  const uid = Number(u.user_id);

  // 1. Qué combinaciones existen hoy
  const combos = await db.execute({
    sql: `SELECT category, subcategory, COUNT(*) n, 'gasto' AS origen FROM expenses WHERE user_id=? GROUP BY category, subcategory
          UNION ALL
          SELECT category, subcategory, COUNT(*) n, 'fijo'  AS origen FROM fixed_expenses WHERE user_id=? GROUP BY category, subcategory`,
    args: [uid, uid],
  });

  for (const r of combos.rows) {
    const cat = String(r.category);
    const sub = r.subcategory ? String(r.subcategory) : "";
    const n = Number(r.n);
    const dest = destino(cat, sub);

    if (!dest) { sinMapear.push(`u${uid}  ${cat}${sub ? " > " + sub : ""}  x${n}`); continue; }
    if (dest === cat && !sub) continue; // ya estaba bien

    const tabla = String(r.origen) === "fijo" ? "fixed_expenses" : "expenses";
    if (String(r.origen) === "fijo") fijos += n; else movidos += n;
    detalle.push(`u${uid}  ${cat}${sub ? " > " + sub : ""}  ->  ${dest}  x${n}${tabla === "fixed_expenses" ? "  (fijo)" : ""}`);

    if (APLICAR) {
      await db.execute({
        sql: `UPDATE ${tabla} SET category=?, subcategory=NULL
              WHERE user_id=? AND category=? AND ${sub ? "subcategory=?" : "(subcategory IS NULL OR subcategory='')"}`,
        args: sub ? [dest, uid, cat, sub] : [dest, uid, cat],
      });
    }
  }

  // 2. Crear las categorías nuevas que falten (solo si ya tenía categorías)
  const existentes = await db.execute("SELECT id, name FROM categories WHERE user_id=? AND tipo='gasto'", [uid]);
  if (existentes.rows.length === 0) continue; // usuario sin sembrar: lo hara la app sola

  const nombres = new Set(existentes.rows.map((r) => String(r.name)));
  const faltan = NUEVAS.filter((n) => !nombres.has(n));
  creadas += faltan.length;
  if (APLICAR && faltan.length) {
    await db.batch(
      faltan.map((name) => ({
        sql: `INSERT OR IGNORE INTO categories (user_id, tipo, name, grupo, icon, color, subcategories, position, created_at)
              VALUES (?, 'gasto', ?, ?, ?, ?, '[]', ?, ?)`,
        args: [uid, name, GRUPO_DE[name], `emoji:${META[name].emoji}`, META[name].color, NUEVAS.indexOf(name), now],
      })),
      "write"
    );
  }

  // 3. Poner en orden las que ya existían, y vaciarles las subcategorías
  if (APLICAR) {
    await db.batch(
      NUEVAS.filter((n) => nombres.has(n)).map((name) => ({
        sql: "UPDATE categories SET grupo=?, subcategories='[]', position=? WHERE user_id=? AND tipo='gasto' AND name=?",
        args: [GRUPO_DE[name], NUEVAS.indexOf(name), uid, name],
      })),
      "write"
    );
  }

  // 4. Borrar las viejas que ya no tenga nada apuntando
  for (const r of existentes.rows) {
    const name = String(r.name);
    if (NUEVAS.includes(name)) continue;
    const uso = await db.execute({
      sql: `SELECT (SELECT COUNT(*) FROM expenses       WHERE user_id=? AND category=?)
                 + (SELECT COUNT(*) FROM fixed_expenses WHERE user_id=? AND category=?)
                 + (SELECT COUNT(*) FROM budgets        WHERE user_id=? AND category=?) AS n`,
      args: [uid, name, uid, name, uid, name],
    });
    // En simulacro los UPDATE no corrieron, asi que se mira el destino previsto
    const quedaria = APLICAR ? Number(uso.rows[0].n) : 0;
    if (quedaria > 0) { sinMapear.push(`u${uid}  ${name} conserva ${quedaria} registros: no se borra`); continue; }
    borradas++;
    detalle.push(`u${uid}  eliminar categoria vacia: ${name}`);
    if (APLICAR) await db.execute("DELETE FROM categories WHERE id=? AND user_id=?", [Number(r.id), uid]);
  }
}

console.log(detalle.join("\n"));
console.log("");
console.log(`${movidos} gastos y ${fijos} gastos fijos recategorizados`);
console.log(`${creadas} categorias nuevas, ${borradas} viejas eliminadas`);
if (sinMapear.length) {
  console.log("\nSIN MAPEAR (no se tocaron, revisalas):\n  " + sinMapear.join("\n  "));
}
console.log(APLICAR ? "\nAPLICADO." : "\nSimulacro: no se toco nada. Para aplicarlo: node scripts/migrate-flat-categories.mjs --aplicar");

const t = await db.execute("SELECT COUNT(*) c FROM expenses");
console.log("Gastos totales (no cambia):", Number(t.rows[0].c));
