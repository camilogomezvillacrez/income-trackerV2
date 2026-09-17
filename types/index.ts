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

export interface Subcategory {
  name: string;
  emoji: string;
}

/** Categoría editable del usuario. icon = "emoji:🍔" o "icon:ShoppingCart" (lucide). */
export interface Category {
  id: number;
  tipo: MovementType;
  name: string;
  /** Grupo que la contiene ("Familia", "Comida"...). "" = sin grupo. */
  grupo: string;
  icon: string;
  color: string;
  subs: Subcategory[];
  position: number;
}

/** Medio de pago del usuario: efectivo, tarjeta, billetera... `last4` es opcional. */
export type PaymentKind = "efectivo" | "debito" | "credito" | "otro";

export interface PaymentMethod {
  id: number;
  name: string;
  emoji: string;
  /** Nombre corto para la lista de movimientos ("Nu"). */
  short: string;
  kind: PaymentKind;
  last4: string | null;
  position: number;
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
  categories: Category[];
  payment_methods: PaymentMethod[];
}

/** Datos que la IA extrae de la foto de un recibo, antes de que el usuario los confirme. */
export interface ReceiptFields {
  proveedor: string | null;
  nit: string | null;
  valor: number | null;
  iva: number | null;
  fecha: string | null;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  factura: string | null;
  metodo_pago: string | null;
  categoria: string | null;
  subcategoria: string | null;
  items: { desc: string; valor: number | null }[];
  confianza: "alta" | "media" | "baja";
  nota: string | null;
}

/**
 * Gasto ya registrado que podria ser el mismo del recibo. El atajo de Wallet ya
 * crea el gasto al pagar, asi que fotografiar el recibo despues lo duplicaba:
 * con esto el recibo se adjunta al que ya existe.
 */
export interface ExpenseMatch {
  id: number;
  amount: number;
  category: string;
  note: string;
  date: string;
  payment_method: string | null;
}

/** Recibo ya guardado. `image_path` es la ruta en el Blob privado, no una URL pública. */
export interface Receipt {
  id: number;
  expense_id: number | null;
  image_path: string;
  proveedor: string | null;
  nit: string | null;
  valor: number | null;
  correo: string | null;
  telefono: string | null;
  fecha: string | null;
  categoria: string | null;
  created_at: string;
}

export type ViewType =
  | "resumen"
  | "movimientos"
  | "metas"
  | "deudas"
  | "cats"
  | "recibos"
  | "configuracion"
  | "categorias-admin"
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
