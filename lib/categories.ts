import type { Client, Row } from "@libsql/client";
import { getDb } from "./db";
import { buildDefaultCategories } from "@/constants/categories";
import type { Category, MovementType, Subcategory } from "@/types";

export const CATEGORY_SELECT =
  "SELECT id, tipo, name, icon, color, subcategories, position FROM categories WHERE user_id=? ORDER BY tipo, position, id";

function parseSubs(raw: unknown): Subcategory[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => s && typeof s.name === "string")
      .map((s) => ({ name: String(s.name), emoji: typeof s.emoji === "string" ? s.emoji : "" }));
  } catch {
    return [];
  }
}

export function rowToCategory(r: Row): Category {
  return {
    id: Number(r.id),
    tipo: String(r.tipo) === "ingreso" ? "ingreso" : "gasto",
    name: String(r.name),
    icon: String(r.icon),
    color: String(r.color),
    subs: parseSubs(r.subcategories),
    position: Number(r.position),
  };
}

/**
 * Primera vez de cada usuario: copia las categorías por defecto y además
 * cualquier nombre que ya aparezca en sus movimientos o gastos fijos, para
 * que nada quede huérfano.
 */
export async function seedCategories(db: Client, userId: number) {
  const [usedExp, usedInc] = await db.batch([
    {
      sql: `SELECT DISTINCT category AS name FROM expenses WHERE user_id=?
            UNION SELECT DISTINCT category FROM fixed_expenses WHERE user_id=?`,
      args: [userId, userId],
    },
    { sql: "SELECT DISTINCT category AS name FROM incomes WHERE user_id=?", args: [userId] },
  ], "read");

  const all = buildDefaultCategories();
  const addUsed = (tipo: MovementType, rows: Row[]) => {
    for (const r of rows) {
      const name = String(r.name ?? "").trim();
      if (!name || all.some((c) => c.tipo === tipo && c.name === name)) continue;
      all.push({
        tipo,
        name,
        icon: name === "General" ? "emoji:⚪" : "emoji:🏷️",
        color: "#6B7280",
        subs: [],
        position: all.filter((c) => c.tipo === tipo).length,
      });
    }
  };
  addUsed("gasto", usedExp.rows);
  addUsed("ingreso", usedInc.rows);

  const now = new Date().toISOString();
  await db.batch(
    all.map((c) => ({
      sql: `INSERT OR IGNORE INTO categories (user_id, tipo, name, icon, color, subcategories, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [userId, c.tipo, c.name, c.icon, c.color, JSON.stringify(c.subs), c.position, now],
    })),
    "write"
  );
}

/** Categorías del usuario (las siembra si todavía no tiene). */
export async function getCategories(userId: number): Promise<Category[]> {
  const db = getDb();
  let res = await db.execute(CATEGORY_SELECT, [userId]);
  if (res.rows.length === 0) {
    await seedCategories(db, userId);
    res = await db.execute(CATEGORY_SELECT, [userId]);
  }
  return res.rows.map(rowToCategory);
}

const ICON_RE  = /^(emoji:\S{1,16}|icon:[A-Za-z0-9]{2,40})$/u;
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export interface CategoryInput {
  name: string;
  icon: string;
  color: string;
  subs: Subcategory[];
}

/** Valida el cuerpo de crear/editar. Devuelve el mensaje de error si algo no cuadra. */
export function validateCategoryInput(body: unknown): CategoryInput | string {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = String(b.name ?? "").trim();
  if (!name || name.length > 40) return "El nombre debe tener entre 1 y 40 caracteres";

  const icon = String(b.icon ?? "");
  if (!ICON_RE.test(icon)) return "Elige un ícono o emoji válido";

  const color = String(b.color ?? "");
  if (!COLOR_RE.test(color)) return "Elige un color válido";

  const subs: Subcategory[] = [];
  for (const s of (Array.isArray(b.subs) ? b.subs : []).slice(0, 40)) {
    const sub = (s ?? {}) as Partial<Subcategory>;
    const n = String(sub.name ?? "").trim().slice(0, 40);
    if (n && !subs.some((x) => x.name.toLowerCase() === n.toLowerCase())) {
      subs.push({ name: n, emoji: String(sub.emoji ?? "").slice(0, 16) });
    }
  }

  return { name, icon, color, subs };
}
