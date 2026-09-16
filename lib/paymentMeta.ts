import type { DashboardData, PaymentMethod } from "@/types";
import { DEFAULT_PAYMENT_METHODS, defaultShort, inferPaymentMeta } from "@/constants/payments";

/*
 * Lectura de medios de pago en el cliente. Mientras no hay datos del servidor
 * (o la caché local es de antes de esta pantalla) se usan los por defecto;
 * los ids negativos marcan que aún no son los reales.
 */
const DEFAULTS: PaymentMethod[] = DEFAULT_PAYMENT_METHODS.map((m, i) => ({ ...m, id: -(i + 1) }));

export function paymentsOf(data: DashboardData | null | undefined): PaymentMethod[] {
  return data?.payment_methods?.length ? data.payment_methods : DEFAULTS;
}

/** Medio por nombre; si ya no existe (gasto viejo, o tarjeta de Apple Pay), uno genérico. */
export function findPayment(
  data: DashboardData | null | undefined,
  name: string | null | undefined
): PaymentMethod {
  const n = (name ?? "").trim();
  return (
    paymentsOf(data).find((m) => m.name.toLowerCase() === n.toLowerCase()) ?? {
      id: 0,
      name: n,
      emoji: inferPaymentMeta(n).emoji,
      short: defaultShort(n),
      kind: inferPaymentMeta(n).kind,
      last4: null,
      position: 999,
    }
  );
}

/** Medio con el que arrancan los formularios: el primero en efectivo, o el primero de la lista. */
export function defaultPayment(data: DashboardData | null | undefined): string {
  const list = paymentsOf(data);
  return (list.find((m) => m.kind === "efectivo") ?? list[0]).name;
}
