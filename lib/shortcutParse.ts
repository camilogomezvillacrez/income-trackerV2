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

/** Comercios frecuentes en Colombia -> categoria. Sin subcategoria: la categoria ya es especifica. */
const RULES: Rule[] = [
  [/cruz verde|farmatodo|drogueri|farmacia|locatel|pasteur/, "Salud", ""],
  [/smart ?fit|bodytech|stark|\bgym\b/, "GYM", ""],
  [/rappi|ifood|didi ?food|merqueo|domicilio/, "Domicilios", ""],
  [/\buber\b|didi|cabify|indrive|\bbeat\b|\btaxi|peaje|flypass|transmilenio|tu ?llave|parqueadero|parking/, "Transporte", ""],
  [/terpel|primax|\besso\b|\bmobil\b|texaco|biomax|zeuss|petrobras|gasolin|estacion de servicio|\beds\b/, "Gasolina", ""],
  [/juan valdez|starbucks|tostao|\boma\b|dunkin|\bcafe\b|cafeteria/, "Restaurantes", ""],
  [/\bexito\b|carulla|jumbo|\bmetro\b|olimpica|\bd1\b|\bara\b|justo ?& ?bueno|isimo|pricesmart|makro|surtimax|colsubsidio|supermercado|minimercado|\boxxo\b|mercado/, "Mercado", ""],
  [/mcdonald|burger|\bkfc\b|frisby|crepes|el corral|presto|domino|papa john|subway|restaurante|pizza|sushi|\bwok\b|andres carne|hamburgues|asadero|panaderia/, "Restaurantes", ""],
  [/netflix|disney|\bhbo\b|max\.com|prime ?video|paramount|crunchyroll|vix|spotify|apple music|deezer|youtube music|youtube premium|apple\.com|icloud|google one|microsoft|adobe|openai|chatgpt|anthropic|claude|notion|github|canva/, "Suscripciones", ""],
  [/playstation|xbox|steam|nintendo|cinemark|cinepolis|procinal|royal films|\bcine\b/, "Entretenimiento", ""],
  [/\bzara\b|h&m|bershka|pull ?& ?bear|arturo calle|studio f|koaj|adidas|\bnike\b|mango|tennis|offcorss|stradivarius/, "Ropa", ""],
  [/barberia|peluqueria|salon de belleza/, "Cuidado Personal", ""],
  [/\benel\b|codensa|\bepm\b|vanti|acueducto|gas natural/, "Servicios", ""],
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
