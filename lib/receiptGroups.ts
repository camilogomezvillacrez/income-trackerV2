/**
 * Agrupa recibos por empresa. El NIT manda: el mismo negocio aparece escrito de
 * mil formas ("D1", "Tiendas D1 S.A.S", "KOBA COLOMBIA") pero el NIT es uno.
 * Sin NIT se agrupa por nombre, ignorando mayúsculas, tildes y puntuación.
 */
export function companyKey(r: { nit: string | null; proveedor: string | null }): string {
  // El dígito de verificación a veces se lee y a veces no: se ignora
  const nit = (r.nit ?? "").split("-")[0].replace(/\D/g, "");
  if (nit.length >= 6) return `nit:${nit}`;

  const name = (r.proveedor ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\b(s\.?\s?a\.?\s?s|s\.?\s?a|ltda|limitada)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  return name ? `name:${name}` : "sin-proveedor";
}

export interface CompanyGroup<T> {
  key: string;
  proveedor: string;
  nit: string | null;
  items: T[];
  total: number;
}

/** Grupos ordenados por nombre; dentro de cada uno, las facturas más recientes primero. */
export function groupByCompany<
  T extends { nit: string | null; proveedor: string | null; valor: number | null; fecha: string | null }
>(receipts: T[]): CompanyGroup<T>[] {
  const map = new Map<string, CompanyGroup<T>>();

  for (const r of receipts) {
    const key = companyKey(r);
    let g = map.get(key);
    if (!g) {
      g = { key, proveedor: "", nit: null, items: [], total: 0 };
      map.set(key, g);
    }
    g.items.push(r);
    g.total += r.valor ?? 0;
    // El nombre más largo suele ser la razón social completa
    if (r.proveedor && r.proveedor.length > g.proveedor.length) g.proveedor = r.proveedor;
    if (!g.nit && r.nit) g.nit = r.nit;
  }

  const groups = [...map.values()];
  for (const g of groups) {
    if (!g.proveedor) g.proveedor = "Sin proveedor";
    g.items.sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? ""));
  }
  return groups.sort((a, b) => a.proveedor.localeCompare(b.proveedor, "es"));
}
