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

export interface DebtPayment {
  id: number;
  amount: number;
  date: string;
  note: string | null;
}

export interface Debt {
  id: number;
  person: string;
  /** 'debo' = yo le debo a alguien · 'me_deben' = alguien me debe */
  type: "debo" | "me_deben";
  amount: number;
  paid: number;
  pending: number;
  pct: number;
  description: string | null;
  date: string;
  due_date: string | null;
  completed: number;
  /** Días que faltan para el vencimiento (negativo = vencida) */
  days_left: number | null;
  payments: DebtPayment[];
}

/** Deudas agrupadas por persona */
export interface DebtPerson {
  person: string;
  me_deben: number;
  debo: number;
  neto: number;
  debts: Debt[];
}

export interface FixedExpense {
  id: number;
  name: string;
  amount: number;
  category: string;
  subcategory: string | null;
  /** Día del mes en que suele caer (1-31) */
  day_of_month: number;
  payment_method: string | null;
  active: number;
  /** Ya quedó registrado en el mes que se está viendo */
  registered: boolean;
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
  debts: Debt[];
  fixed_expenses: FixedExpense[];
  all_months: string[];
  budgets: Record<string, number>;
  weekly: Record<string, number>;
}

export type ViewType =
  | "resumen"
  | "movimientos"
  | "metas"
  | "deudas"
  | "cats"
  | "asistente"
  | "configuracion"
  | `cat-${string}`;

export type ModalType =
  | "registro"
  | "edit"
  | "del"
  | "meta"
  | "abono"
  | "deuda"
  | "abono-deuda"
  | "fijo"
  | null;

export type MovTab = "todos" | "ingreso" | "gasto";
