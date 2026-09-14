import type { Category } from "@/types";

export interface CatMeta {
  emoji: string;
  color: string;
  bg: string;
}

export const CAT_META: Record<string, CatMeta> = {
  Vivienda:        { emoji: "🏠", color: "#3B6D11", bg: "#EAF3DE" },
  "Alimentación":  { emoji: "🍔", color: "#1D4ED8", bg: "#DBEAFE" },
  Transporte:      { emoji: "🚗", color: "#B45309", bg: "#FEF3C7" },
  Salud:           { emoji: "❤️", color: "#9D174D", bg: "#FCE7F3" },
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
  General:            { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" },
  Salario:         { emoji: "💰", color: "#3B6D11", bg: "#EAF3DE" },
  Freelance:       { emoji: "🧑‍💻", color: "#1D4ED8", bg: "#DBEAFE" },
  Ventas:          { emoji: "📦", color: "#B45309", bg: "#FEF3C7" },
  Arriendo:        { emoji: "🏘️", color: "#374151", bg: "#F3F4F6" },
  Inversiones:     { emoji: "📈", color: "#065F46", bg: "#D1FAE5" },
  Otros:           { emoji: "🎁", color: "#6B7280", bg: "#F3F4F6" },
};

export const EXP_CATS = [
  "Vivienda",
  "Alimentación",
  "Transporte",
  "Salud",
  "Entretenimiento",
  "Ropa",
  "Deudas",
  "Ahorro",
  "Educación",
  "Gastos hormiga",
  "Tecnología",
  "Suscripciones",
  "Cuidado personal",
  "Pólizas",
] as const;

export const INC_CATS = [
  "Salario",
  "Freelance",
  "Ventas",
  "Arriendo",
  "Inversiones",
  "Otros",
] as const;

export const SUBCATS: Record<string, string[]> = {
  Vivienda:        ["Arriendo", "Servicios", "Agua", "Luz", "Gas", "Internet", "Administración", "Pago empleada", "Pago jardín", "Pago clases extras niños"],
  "Alimentación":  ["Mercado", "Restaurante", "Domicilio", "Desayuno"],
  Transporte:      ["Uber", "Taxi", "Gasolina", "Bus", "TransMilenio", "Peaje"],
  Salud:           ["Médico", "Medicina", "Farmacia", "Gym", "Psicólogo"],
  Entretenimiento: ["Streaming", "Cine", "Salidas", "Videojuegos"],
  Ropa:            ["Ropa", "Zapatos", "Accesorios"],
  Deudas:          ["Préstamo", "Crédito", "Cuota", "Tarjeta"],
  Ahorro:          ["Fondo", "CDT", "Inversión"],
  "Educación":     ["Curso", "Libro", "Universidad"],
  "Gastos hormiga":["Café", "Snack", "Recarga", "Parqueadero", "Propina"],
  Tecnología:      ["Celular", "Computador", "Tablet", "Smartwatch", "Accesorios", "Software", "Suscripciones"],
  Suscripciones:      ["Streaming", "Música", "Software", "Juegos", "Noticias", "Fitness"],
  "Cuidado personal": ["Corte de cabello", "Uñas", "Barbería", "Depilación", "Maquillaje", "Skincare", "Spa"],
  "Pólizas":          ["Póliza de salud", "Póliza de vida", "Seguro mascota", "Seguro funerario"],
};

export const SUBCAT_EMOJIS: Record<string, Record<string, string>> = {
  Vivienda:        { Arriendo:"🏠", Servicios:"🏡", Agua:"💧", Luz:"⚡", Gas:"🔥", Internet:"📡", "Administración":"🏢", "Pago empleada":"🧹", "Pago jardín":"🌿", "Pago clases extras niños":"🎒" },
  "Alimentación":  { Mercado:"🛒", Restaurante:"🍽️", Domicilio:"🛵", Desayuno:"☕" },
  Transporte:      { Uber:"🚘", Taxi:"🚕", Gasolina:"⛽", Bus:"🚌", TransMilenio:"🚈", Peaje:"🛣️" },
  Salud:           { "Médico":"🏥", Medicina:"💊", Farmacia:"🪙", Gym:"💪", "Psicólogo":"🧠" },
  Entretenimiento: { Streaming:"📺", Cine:"🎬", Salidas:"🎉", Videojuegos:"🎮" },
  Ropa:            { Ropa:"👕", Zapatos:"👟", Accesorios:"👜" },
  Deudas:          { "Préstamo":"💸", "Crédito":"💳", Cuota:"📋", Tarjeta:"💳" },
  Ahorro:          { Fondo:"🐷", CDT:"📋", "Inversión":"📈" },
  "Educación":     { Curso:"📖", Libro:"📚", Universidad:"🏫" },
  "Gastos hormiga":{ "Café":"☕", Snack:"🍪", Recarga:"📱", Parqueadero:"🅿️", Propina:"💝" },
  Tecnología:      { Celular:"📱", Computador:"💻", Tablet:"📲", Smartwatch:"⌚", Accesorios:"🖱️", Software:"⚙️", Suscripciones:"🔑" },
  Suscripciones:      { Streaming:"📺", "Música":"🎵", Software:"💾", Juegos:"🎮", Noticias:"📰", Fitness:"🏃" },
  "Cuidado personal": { "Corte de cabello":"✂️", "Uñas":"💅", "Barbería":"🪒", "Depilación":"🧴", "Maquillaje":"💄", Skincare:"🧴", Spa:"🧖" },
  "Pólizas":          { "Póliza de salud":"🏥", "Póliza de vida":"💙", "Seguro mascota":"🐾", "Seguro funerario":"⚰️" },
};

export const PAYMENT_METHODS = ["Efectivo", "Visa Crédito", "Nu Crédito", "American Express"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Emoji y nombre corto de cada método (lista de movimientos, botones de los modales). */
export const PAYMENT_META: Record<PaymentMethod, { emoji: string; short: string }> = {
  "Efectivo":         { emoji: "💵", short: "Efectivo" },
  "Visa Crédito":     { emoji: "💳", short: "Visa" },
  "Nu Crédito":       { emoji: "🟣", short: "Nu" },
  "American Express": { emoji: "🔷", short: "Amex" },
};

/** Métodos que no están en la lista (p. ej. el nombre de tarjeta que manda Apple Pay) usan 💳 y su propio nombre. */
export function paymentMeta(method: string | null | undefined) {
  return PAYMENT_META[method as PaymentMethod] ?? { emoji: "💳", short: method ?? "" };
}

/**
 * Categorías con las que arranca cada usuario. Se copian a la base de datos la
 * primera vez (lib/categories.ts) y desde ahí el usuario las edita.
 */
export function buildDefaultCategories(): Omit<Category, "id">[] {
  const gasto = EXP_CATS.map((name, i) => ({
    tipo: "gasto" as const,
    name,
    icon: `emoji:${CAT_META[name].emoji}`,
    color: CAT_META[name].color,
    subs: (SUBCATS[name] ?? []).map((s) => ({ name: s, emoji: SUBCAT_EMOJIS[name]?.[s] ?? "" })),
    position: i,
  }));
  const ingreso = INC_CATS.map((name, i) => ({
    tipo: "ingreso" as const,
    name,
    icon: `emoji:${CAT_META[name].emoji}`,
    color: CAT_META[name].color,
    subs: [],
    position: i,
  }));
  return [...gasto, ...ingreso];
}
