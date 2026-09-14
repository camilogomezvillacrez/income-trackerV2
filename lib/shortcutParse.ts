/*
 * Lógica pura del atajo de Apple Wallet (sin imports, para probarla aislada).
 */

/**
 * Wallet entrega el monto como texto con formato local: "$45.900,00",
 * "COP 12.500", "12,50". Si el último separador va seguido de 1–2 dígitos
 * es decimal; si no, todos los separadores son de miles.
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) && raw !== 0 ? Math.abs(raw) : null;

  const s = String(raw ?? "").replace(/[^\d.,]/g, "");
  if (!/\d/.test(s)) return null;

  const lastSep = Math.max(s.lastIndexOf(","), s.lastIndexOf("."));
  const decimals = lastSep >= 0 ? s.length - lastSep - 1 : 0;

  let n: number;
  if (lastSep >= 0 && decimals >= 1 && decimals <= 2) {
    const int = s.slice(0, lastSep).replace(/[.,]/g, "");
    n = Number(`${int || "0"}.${s.slice(lastSep + 1)}`);
  } else {
    n = Number(s.replace(/[.,]/g, ""));
  }

  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

type Rule = [RegExp, string, string];

/** Comercios frecuentes en Colombia → [categoría, subcategoría]. El orden importa. */
const RULES: Rule[] = [
  [/cruz verde|farmatodo|drogueri|farmacia|locatel|pasteur/, "Salud", "Farmacia"],
  [/smart ?fit|bodytech|stark|\bgym\b/, "Salud", "Gym"],
  [/rappi|ifood|didi ?food|merqueo|domicilio/, "Alimentación", "Domicilio"],
  [/\buber\b|didi|cabify|indrive|\bbeat\b/, "Transporte", "Uber"],
  [/\btaxi/, "Transporte", "Taxi"],
  [/terpel|primax|\besso\b|\bmobil\b|texaco|biomax|zeuss|petrobras|gasolin|estacion de servicio|\beds\b/, "Transporte", "Gasolina"],
  [/peaje|flypass/, "Transporte", "Peaje"],
  [/transmilenio|tu ?llave/, "Transporte", "TransMilenio"],
  [/parqueadero|parking/, "Gastos hormiga", "Parqueadero"],
  [/juan valdez|starbucks|tostao|\boma\b|dunkin|\bcafe\b|cafeteria/, "Gastos hormiga", "Café"],
  [/\bexito\b|carulla|jumbo|\bmetro\b|olimpica|\bd1\b|\bara\b|justo ?& ?bueno|isimo|pricesmart|makro|surtimax|colsubsidio|supermercado|minimercado|\boxxo\b|mercado/, "Alimentación", "Mercado"],
  [/mcdonald|burger|\bkfc\b|frisby|crepes|el corral|presto|domino|papa john|subway|restaurante|pizza|sushi|\bwok\b|andres carne|hamburgues|asadero|panaderia/, "Alimentación", "Restaurante"],
  [/netflix|disney|\bhbo\b|max\.com|prime ?video|paramount|crunchyroll|vix/, "Suscripciones", "Streaming"],
  [/spotify|apple music|deezer|youtube music|youtube premium/, "Suscripciones", "Música"],
  [/apple\.com|icloud|google one|microsoft|adobe|openai|chatgpt|anthropic|claude|notion|github|canva/, "Suscripciones", "Software"],
  [/playstation|xbox|steam|nintendo/, "Entretenimiento", "Videojuegos"],
  [/cinemark|cinepolis|procinal|royal films|\bcine\b/, "Entretenimiento", "Cine"],
  [/\bzara\b|h&m|bershka|pull ?& ?bear|arturo calle|studio f|koaj|adidas|\bnike\b|mango|tennis|offcorss|stradivarius/, "Ropa", "Ropa"],
  [/barberia|peluqueria|salon de belleza/, "Cuidado personal", "Barbería"],
  [/\benel\b|codensa|\bepm\b|vanti|acueducto|gas natural/, "Vivienda", "Servicios"],
];

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

export function categorizeByRules(merchant: string): { category: string; subcategory: string } | null {
  const m = normalize(merchant);
  for (const [re, category, subcategory] of RULES) {
    if (re.test(m)) return { category, subcategory };
  }
  return null;
}

/** Fecha de hoy en Colombia: a las 9 p. m. en UTC ya es mañana. */
export function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());
}
