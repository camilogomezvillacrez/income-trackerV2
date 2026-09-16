import type { Category, DashboardData, MovementType } from "@/types";
import { buildDefaultCategories, DEFAULT_GROUP, GROUPS, GROUP_COLORS } from "@/constants/categories";

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
      grupo: "",
      icon: name === "General" ? "emoji:⚪" : "emoji:🏷️",
      color: "#6B7280",
      subs: [],
      position: 0,
    }
  );
}

export interface CategoryGroup {
  name: string;
  color: string;
  categories: Category[];
}

/**
 * Reparte las categorías en sus grupos, en el orden de GROUPS; los grupos que
 * el usuario haya inventado van al final y los vacíos no se muestran. Si nada
 * tiene grupo (ingresos) devuelve un solo bloque sin título.
 */
export function groupCategories(categories: Category[]): CategoryGroup[] {
  if (categories.every((c) => !c.grupo.trim())) {
    return [{ name: "", color: GROUP_COLORS[DEFAULT_GROUP], categories }];
  }

  const buckets = new Map<string, Category[]>();
  for (const c of categories) {
    const key = c.grupo.trim() || DEFAULT_GROUP;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(c);
    else buckets.set(key, [c]);
  }

  const known = GROUPS.map((g) => g.name);
  const custom = [...buckets.keys()].filter((n) => !known.includes(n)).sort((a, b) => a.localeCompare(b, "es"));

  return [...known, ...custom]
    .filter((name) => buckets.has(name))
    .map((name) => ({
      name,
      color: GROUP_COLORS[name] ?? GROUP_COLORS[DEFAULT_GROUP],
      categories: buckets.get(name) as Category[],
    }));
}
