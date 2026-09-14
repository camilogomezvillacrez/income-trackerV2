import type { Category, DashboardData, MovementType } from "@/types";
import { buildDefaultCategories } from "@/constants/categories";

/*
 * Lectura de categorías en el cliente. Mientras no hay datos del servidor
 * (o la caché local es de antes de las categorías editables) se usan las
 * por defecto; los ids negativos marcan que aún no son las reales.
 */
const DEFAULTS: Category[] = buildDefaultCategories().map((c, i) => ({ ...c, id: -(i + 1) }));

export function categoriesOf(data: DashboardData | null | undefined, tipo?: MovementType): Category[] {
  const list = data?.categories?.length ? data.categories : DEFAULTS;
  return tipo ? list.filter((c) => c.tipo === tipo) : list;
}

/** Categoría por nombre; si ya no existe (movimiento viejo), un genérico gris. */
export function findCategory(
  data: DashboardData | null | undefined,
  name: string,
  tipo?: MovementType
): Category {
  const match = (c: Category) => c.name === name && (!tipo || c.tipo === tipo);
  return (
    categoriesOf(data).find(match) ??
    DEFAULTS.find(match) ?? {
      id: 0,
      tipo: tipo ?? "gasto",
      name,
      icon: name === "General" ? "emoji:⚪" : "emoji:🏷️",
      color: "#6B7280",
      subs: [],
      position: 0,
    }
  );
}
