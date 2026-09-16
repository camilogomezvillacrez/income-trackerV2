import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number): string {
  return "$ " + Math.round(n).toLocaleString("es-CO");
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function monthLabel(ym: string): string {
  const [year, month] = ym.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("es-CO", { month: "short", year: "numeric" });
}

/**
 * Texto con puntos de miles para los campos de plata: 1250000 -> "1.250.000".
 *
 * Sin decimales a proposito: el peso colombiano no tiene centavos y arrastrar
 * decimales solo trae errores de redondeo. El punto es separador de miles.
 */
export function fmtMiles(v: string | number): string {
  const digitos =
    typeof v === "number" ? String(Math.round(Math.abs(v))) : v.replace(/\D/g, "");
  if (!digitos) return "";
  return Number(digitos).toLocaleString("es-CO");
}

/** Vuelta atras para enviar al API: "1.250.000" -> 1250000 */
export function parseMiles(texto: string): number {
  return Number(String(texto ?? "").replace(/\D/g, "")) || 0;
}

/**
 * Fecha de hoy en Colombia (YYYY-MM-DD).
 *
 * new Date().toISOString() da UTC, y con UTC-5 eso a partir de las 7 de la
 * noche ya es el dia siguiente. Para decidir si un gasto fijo vence hoy, esa
 * diferencia registra el gasto un dia antes de tiempo.
 */
export function todayBogota(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Ultimo dia del mes YYYY-MM. El dia 0 del siguiente es el ultimo de este. */
export function lastDayOfMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/**
 * Dia en que vence un gasto fijo dentro de un mes concreto. Un fijo del 31 en
 * un mes de 30 vence el 30, no se salta el mes.
 */
export function dueDayIn(month: string, dayOfMonth: number): number {
  return Math.min(Math.max(dayOfMonth || 1, 1), lastDayOfMonth(month));
}
