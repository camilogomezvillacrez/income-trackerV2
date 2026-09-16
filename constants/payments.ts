import type { PaymentKind, PaymentMethod } from "@/types";

/** Medios con los que arranca cada usuario; desde ahí los edita en Configuración. */
export const DEFAULT_PAYMENT_METHODS: Omit<PaymentMethod, "id">[] = [
  { name: "Efectivo",        emoji: "💵", short: "Efectivo", kind: "efectivo", last4: null, position: 0 },
  { name: "Tarjeta débito",  emoji: "💳", short: "Débito",   kind: "debito",   last4: null, position: 1 },
  { name: "Tarjeta crédito", emoji: "💳", short: "Crédito",  kind: "credito",  last4: null, position: 2 },
];

export const PAYMENT_KINDS: { value: PaymentKind; label: string; emoji: string }[] = [
  { value: "efectivo", label: "Efectivo", emoji: "💵" },
  { value: "debito",   label: "Débito",   emoji: "💳" },
  { value: "credito",  label: "Crédito",  emoji: "💳" },
  { value: "otro",     label: "Otro",     emoji: "🏦" },
];

export const PAYMENT_EMOJIS = ["💵", "💳", "🟣", "🔷", "🔴", "🟡", "🟢", "🔵", "🏦", "📱", "🪙", "🧾"];

/**
 * Nombre suelto (un gasto viejo, o la tarjeta que manda Apple Pay) → tipo y
 * emoji razonables, para no dejar en blanco lo que se siembra o se muestra.
 */
export function inferPaymentMeta(name: string): { kind: PaymentKind; emoji: string } {
  const n = name.toLowerCase();
  if (/efectivo|cash|billete/.test(n))            return { kind: "efectivo", emoji: "💵" };
  if (/cr[ée]dito|credit|amex|american express/.test(n)) return { kind: "credito", emoji: "💳" };
  if (/d[ée]bito|debit|ahorros/.test(n))          return { kind: "debito",  emoji: "💳" };
  return { kind: "otro", emoji: "💳" };
}

/** Nombre corto por defecto: la primera palabra distintiva, para la lista de movimientos. */
export function defaultShort(name: string): string {
  const clean = name.replace(/tarjeta\s*/i, "").trim() || name;
  return clean.split(/\s+/)[0].slice(0, 14);
}

/** Etiqueta completa con dígitos: "Nu Crédito ••4821". */
export function paymentLabel(m: Pick<PaymentMethod, "name" | "last4">): string {
  return m.last4 ? `${m.name} ••${m.last4}` : m.name;
}
