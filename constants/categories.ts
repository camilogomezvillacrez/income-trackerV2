import type { Category } from "@/types";

export interface CatMeta {
  emoji: string;
  color: string;
  bg: string;
}

/**
 * Grupos: el nivel de arriba (grupo > categoría). Solo ordenan visualmente; lo
 * que se guarda en un movimiento es el nombre de la categoría. El orden de este
 * array es el orden en pantalla.
 */
export interface Group {
  name: string;
  color: string;
}

export const GROUPS: Group[] = [
  { name: "Comida y Bebida",   color: "#F97316" },
  { name: "Estilo de Vida",    color: "#8B5CF6" },
  { name: "Familia",           color: "#F59E0B" },
  { name: "Hogar y Servicios", color: "#2563EB" },
  { name: "Otros",             color: "#6B7280" },
  { name: "Transporte",        color: "#0EA5E9" },
];

/** Grupo al que cae cualquier categoría sin grupo asignado. */
export const DEFAULT_GROUP = "Otros";

export const GROUP_COLORS: Record<string, string> = Object.fromEntries(
  GROUPS.map((g) => [g.name, g.color])
);

export const CAT_META: Record<string, CatMeta> = {
  Mercado:            { emoji: "🛒", color: "#B45309", bg: "#FEF3C7" },
  Restaurantes:       { emoji: "🍽️", color: "#C2410C", bg: "#FFEDD5" },
  Domicilios:         { emoji: "🛵", color: "#EA580C", bg: "#FFEDD5" },
  "Cuidado Personal": { emoji: "💅", color: "#BE185D", bg: "#FDF2F8" },
  "Educación":        { emoji: "📚", color: "#6D28D9", bg: "#EDE9FE" },
  Entretenimiento:    { emoji: "🎬", color: "#7C3AED", bg: "#EDE9FE" },
  GYM:                { emoji: "💪", color: "#047857", bg: "#D1FAE5" },
  Ropa:               { emoji: "👕", color: "#065F46", bg: "#D1FAE5" },
  Salud:              { emoji: "❤️", color: "#9D174D", bg: "#FCE7F3" },
  Suplementos:        { emoji: "🥤", color: "#059669", bg: "#D1FAE5" },
  "Tecnología":       { emoji: "💻", color: "#0369A1", bg: "#E0F2FE" },
  Hijos:              { emoji: "🧒", color: "#D97706", bg: "#FEF3C7" },
  Mascotas:           { emoji: "🐾", color: "#92400E", bg: "#FEF3C7" },
  Regalos:            { emoji: "🎁", color: "#BE123C", bg: "#FFE4E6" },
  Arriendo:           { emoji: "🏠", color: "#1D4ED8", bg: "#DBEAFE" },
  Servicios:          { emoji: "⚡", color: "#2563EB", bg: "#DBEAFE" },
  Suscripciones:      { emoji: "🔄", color: "#4F46E5", bg: "#E0E7FF" },
  Deudas:             { emoji: "💳", color: "#991B1B", bg: "#FEE2E2" },
  "Pólizas":          { emoji: "🛡️", color: "#0C4A6E", bg: "#E0F2FE" },
  Innecesario:        { emoji: "🍸", color: "#6B7280", bg: "#F3F4F6" },
  Ahorro:             { emoji: "🐷", color: "#374151", bg: "#F3F4F6" },
  Gasolina:           { emoji: "⛽", color: "#0369A1", bg: "#E0F2FE" },
  Transporte:         { emoji: "🚗", color: "#0EA5E9", bg: "#E0F2FE" },
  General:            { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" },
  Salario:            { emoji: "💰", color: "#3B6D11", bg: "#EAF3DE" },
  Freelance:          { emoji: "🧑‍💻", color: "#1D4ED8", bg: "#DBEAFE" },
  Ventas:             { emoji: "📦", color: "#B45309", bg: "#FEF3C7" },
  Inversiones:        { emoji: "📈", color: "#065F46", bg: "#D1FAE5" },
  Otros:              { emoji: "🎁", color: "#6B7280", bg: "#F3F4F6" },
};

/**
 * Categorías de gasto por defecto, en el orden en que se muestran, con su
 * grupo. Una categoría vive en un solo grupo.
 *
 * No hay subcategorías: la categoría ya es específica. "Domicilios" dice más
 * que "Alimentación > Domicilio" y se elige en un toque en vez de dos. El
 * detalle fino de cada gasto va en su nota.
 */
export const EXP_CATS_BY_GROUP: [group: string, cats: readonly string[]][] = [
  ["Comida y Bebida",   ["Mercado", "Restaurantes", "Domicilios"]],
  ["Estilo de Vida",    ["Cuidado Personal", "Educación", "Entretenimiento", "GYM", "Ropa", "Salud", "Suplementos", "Tecnología"]],
  ["Familia",           ["Hijos", "Mascotas", "Regalos"]],
  ["Hogar y Servicios", ["Arriendo", "Servicios", "Suscripciones"]],
  ["Otros",             ["Deudas", "Pólizas", "Innecesario", "Ahorro"]],
  ["Transporte",        ["Gasolina", "Transporte"]],
];

export const EXP_CATS = EXP_CATS_BY_GROUP.flatMap(([, cats]) => cats);

/** Grupo de cada categoría de gasto por defecto. */
export const GROUP_OF: Record<string, string> = Object.fromEntries(
  EXP_CATS_BY_GROUP.flatMap(([group, cats]) => cats.map((c) => [c, group]))
);

export const INC_CATS = [
  "Salario",
  "Freelance",
  "Ventas",
  "Arriendo",
  "Inversiones",
  "Otros",
] as const;

/**
 * Categorías con las que arranca cada usuario. Se copian a la base de datos la
 * primera vez (lib/categories.ts) y desde ahí el usuario las edita.
 */
export function buildDefaultCategories(): Omit<Category, "id">[] {
  const gasto = EXP_CATS.map((name, i) => ({
    tipo: "gasto" as const,
    name,
    grupo: GROUP_OF[name] ?? DEFAULT_GROUP,
    icon: `emoji:${CAT_META[name].emoji}`,
    color: CAT_META[name].color,
    subs: [],
    position: i,
  }));
  const ingreso = INC_CATS.map((name, i) => ({
    tipo: "ingreso" as const,
    name,
    grupo: "",
    icon: `emoji:${CAT_META[name].emoji}`,
    color: CAT_META[name].color,
    subs: [],
    position: i,
  }));
  return [...gasto, ...ingreso];
}
