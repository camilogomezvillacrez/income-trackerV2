export type MovementType = "ingreso" | "gasto";

export interface Movement {
  id: number;
  tipo: MovementType;
  amount: number;
  category: string;
  subcategory: string | null;
  note: string;
  date: string;
  payment_method: string | null;
}

export interface CategoryTotal {
  category: string;
  total: number;
  subs: { name: string; total: number }[];
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  saved: number;
  pct: number;
  falta: number;
  emoji: string;
  completed: number;
  meses_restantes: number | null;
}

export interface MonthlyRow {
  month: string;
  ingresos: number;
  gastos: number;
}

export interface DashboardData {
  monthly: MonthlyRow[];
  by_category: CategoryTotal[];
  by_cat_inc: { category: string; t: number }[];
  recent: Movement[];
  all_movs: Movement[];
  month_inc: number;
  month_exp: number;
  balance: number;
  tasa_ahorro: number;
  savings_target: number;
  current_month: string;
  goals: Goal[];
  all_months: string[];
  budgets: Record<string, number>;
  weekly: Record<string, number>;
}

export type ViewType =
  | "resumen"
  | "movimientos"
  | "metas"
  | "cats"
  | "configuracion"
  | `cat-${string}`;

export type ModalType =
  | "registro"
  | "edit"
  | "del"
  | "meta"
  | "abono"
  | null;

export type MovTab = "todos" | "ingreso" | "gasto";
