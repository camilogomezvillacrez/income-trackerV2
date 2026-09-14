import { clearCache } from "./dashboardCache";

/*
 * Marca "ya se desbloqueó en esta apertura de la app". Vive en sessionStorage,
 * que iOS borra al cerrar la app desde la multitarea (pero no al cambiar de
 * app y volver): así cada arranque en frío pide Face ID otra vez.
 */
const UNLOCKED_KEY = "fin:unlocked";

export function markUnlocked() {
  try {
    sessionStorage.setItem(UNLOCKED_KEY, "1");
  } catch {
    // Sin almacenamiento: se pedirá Face ID en cada carga, que es lo seguro
  }
}

export function isUnlockedThisLaunch(): boolean {
  try {
    return sessionStorage.getItem(UNLOCKED_KEY) === "1";
  } catch {
    return false;
  }
}

/** Cierra la sesión y borra los datos guardados en el teléfono. */
export async function logout(redirectTo = "/login") {
  clearCache();
  try {
    sessionStorage.removeItem(UNLOCKED_KEY);
  } catch {
    // Sin almacenamiento: nada que borrar
  }
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Sin red: igual sacamos al usuario de la pantalla
  }
  window.location.href = redirectTo;
}
