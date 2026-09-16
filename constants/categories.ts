import type { Category } from "@/types";

export interface CatMeta {
  emoji: string;
  color: string;
  bg: string;
}

/**
 * Grupos: el nivel de arriba de la jerarquía (grupo > categoría > subcategoría).
 * Solo ordenan visualmente; lo que se guarda en un movimiento sigue siendo el
 * nombre de la categoría. El orden de este array es el orden en pantalla.
 */
export interface Group {
  name: string;
  color: string;
}

export const GROUPS: Group[] = [
  { name: "Hogar y Servicios", color: "#2563EB" },
  { name: "Comida",            color: "#F97316" },
  { name: "Transporte",        color: "#0EA5E9" },
  { name: "Salud y Bienestar", color: "#EC4899" },
  { name: "Estilo de Vida",    color: "#8B5CF6" },
  { name: "Familia",           color: "#F59E0B" },
  { name: "Financiero",        color: "#10B981" },
  { name: "Otros",             color: "#6B7280" },
];

/** Grupo al que cae cualquier categoría sin grupo asignado. */
export const DEFAULT_GROUP = "Otros";

export const GROUP_COLORS: Record<string, string> = Object.fromEntries(
  GROUPS.map((g) => [g.name, g.color])
);

export const CAT_META: Record<string, CatMeta> = {
  Vivienda:        { emoji: "🏠", color: "#3B6D11", bg: "#EAF3DE" },
  "Alimentación":  { emoji: "🍔", color: "#1D4ED8", bg: "#DBEAFE" },
  Transporte:      { emoji: "🚗", color: "#B45309", bg: "#FEF3C7" },
  Salud:           { emoji: "❤️", color: "#9D174D", bg: "#FCE7F3" },
  Gym:             { emoji: "💪", color: "#047857", bg: "#D1FAE5" },
  Entretenimiento: { emoji: "🎬", color: "#5B21B6", bg: "#EDE9FE" },
  Ropa:            { emoji: "👕", color: "#065F46", bg: "#D1FAE5" },
  Deudas:          { emoji: "💳", color: "#991B1B", bg: "#FEE2E2" },
  Ahorro:          { emoji: "🐷", color: "#374151", bg: "#F3F4F6" },
  "Educación":     { emoji: "📚", color: "#1D4ED8", bg: "#DBEAFE" },
  "Gastos hormiga":{ emoji: "🐜", color: "#B45309", bg: "#FEF3C7" },
  Tecnología:      { emoji: "💻", color: "#0369A1", bg: "#E0F2FE" },
  Suscripciones:   { emoji: "🔄", color: "#0E7490", bg: "#CFFAFE" },
  "Cuidado personal": { emoji: "💅", color: "#BE185D", bg: "#FDF2F8" },
  "Pólizas":          { emoji: "🛡️", color: "#0C4A6E", bg: "#E0F2FE" },
  Mascotas:           { emoji: "🐾", color: "#92400E", bg: "#FEF3C7" },
  Hijos:              { emoji: "🧒", color: "#C2410C", bg: "#FFEDD5" },
  Regalos:            { emoji: "🎁", color: "#BE123C", bg: "#FFE4E6" },
  General:            { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" },
  Salario:         { emoji: "💰", color: "#3B6D11", bg: "#EAF3DE" },
  Freelance:       { emoji: "🧑‍💻", color: "#1D4ED8", bg: "#DBEAFE" },
  Ventas:          { emoji: "📦", color: "#B45309", bg: "#FEF3C7" },
  Arriendo:        { emoji: "🏘️", color: "#374151", bg: "#F3F4F6" },
  Inversiones:     { emoji: "📈", color: "#065F46", bg: "#D1FAE5" },
  Otros:           { emoji: "🎁", color: "#6B7280", bg: "#F3F4F6" },
};

/**
 * Categorías de gasto por defecto, en el orden en que se muestran, con su
 * grupo. Una categoría vive en un solo grupo.
 */
export const EXP_CATS_BY_GROUP: [group: string, cats: readonly string[]][] = [
  ["Hogar y Servicios", ["Vivienda", "Suscripciones"]],
  ["Comida",            ["Alimentación"]],
  ["Transporte",        ["Transporte"]],
  ["Salud y Bienestar", ["Salud", "Gym", "Pólizas"]],
  ["Estilo de Vida",    ["Entretenimiento", "Ropa", "Cuidado personal", "Educación", "Tecnología"]],
  ["Familia",           ["Mascotas", "Hijos", "Regalos"]],
  ["Financiero",        ["Deudas", "Ahorro"]],
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
 * Subcategorías: pocas y sin solaparse con otra categoría. Si algo necesita
 * más detalle, va en la nota del movimiento, no en una subcategoría nueva.
 */
export const SUBCATS: Record<string, string[]> = {
  Vivienda:        ["Arriendo", "Servicios", "Internet", "Administración"],
  Suscripciones:   ["Streaming", "Software", "Música"],
  "Alimentación":  ["Mercado", "Restaurante", "Domicilio", "Café"],
  Transporte:      ["Gasolina", "Uber/Taxi", "Público", "Parqueadero"],
  Salud:           ["Médico", "Farmacia", "Terapia"],
  Gym:             ["Mensualidad", "Suplementos"],
  Entretenimiento: ["Salidas", "Cine", "Videojuegos"],
  "Cuidado personal": ["Peluquería", "Uñas", "Skincare"],
  Mascotas:        ["Comida", "Veterinario"],
  Hijos:           ["Colegio", "Clases", "Ropa"],
};

export const SUBCAT_EMOJIS: Record<string, Record<string, string>> = {
  Vivienda:        { Arriendo:"🏠", Servicios:"⚡", Internet:"📡", "Administración":"🏢" },
  Suscripciones:   { Streaming:"📺", Software:"💾", "Música":"🎵" },
  "Alimentación":  { Mercado:"🛒", Restaurante:"🍽️", Domicilio:"🛵", "Café":"☕" },
  Transporte:      { Gasolina:"⛽", "Uber/Taxi":"🚕", "Público":"🚌", Parqueadero:"🅿️" },
  Salud:           { "Médico":"🏥", Farmacia:"💊", Terapia:"🧠" },
  Gym:             { Mensualidad:"💪", Suplementos:"🥤" },
  Entretenimiento: { Salidas:"🎉", Cine:"🎬", Videojuegos:"🎮" },
  "Cuidado personal": { "Peluquería":"✂️", "Uñas":"💅", Skincare:"🧴" },
  Mascotas:        { Comida:"🦴", Veterinario:"🩺" },
  Hijos:           { Colegio:"🎒", Clases:"🎨", Ropa:"👕" },
};

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
    subs: (SUBCATS[name] ?? []).map((s) => ({ name: s, emoji: SUBCAT_EMOJIS[name]?.[s] ?? "" })),
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
