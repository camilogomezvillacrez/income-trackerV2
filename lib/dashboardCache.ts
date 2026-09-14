import type { DashboardData } from "@/types";

/*
 * Copia local del dashboard por usuario y mes. Al abrir la app se pinta
 * esto al instante y el servidor actualiza por detrás (como una app nativa).
 */
const PREFIX = "dash:v1:";

const key = (email: string, month: string) => `${PREFIX}${email}:${month}`;

export function readCache(email: string, month: string): DashboardData | null {
  if (!email) return null;
  try {
    const raw = localStorage.getItem(key(email, month));
    return raw ? (JSON.parse(raw) as DashboardData) : null;
  } catch {
    return null;
  }
}

export function writeCache(email: string, month: string, data: DashboardData) {
  if (!email) return;
  try {
    localStorage.setItem(key(email, month), JSON.stringify(data));
  } catch {
    // Almacenamiento lleno o bloqueado: la app sigue funcionando sin caché
  }
}

export function clearCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // Sin acceso al almacenamiento: nada que borrar
  }
}
