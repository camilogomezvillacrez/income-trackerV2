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
  General:         { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" },
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
  Vivienda:        ["Arriendo", "Servicios", "Agua", "Luz", "Gas", "Internet", "Administración"],
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
};

export const SUBCAT_EMOJIS: Record<string, Record<string, string>> = {
  Vivienda:        { Arriendo:"🏠", Servicios:"🏡", Agua:"💧", Luz:"⚡", Gas:"🔥", Internet:"📡", "Administración":"🏢" },
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
};

export const PAYMENT_METHODS = ["Efectivo", "Visa Crédito", "Nu Crédito"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
