import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmt(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-CO");
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
