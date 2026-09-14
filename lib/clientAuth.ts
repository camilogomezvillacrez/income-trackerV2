import { clearCache } from "./dashboardCache";

/** Cierra la sesión y borra los datos guardados en el teléfono. */
export async function logout() {
  clearCache();
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Sin red: igual sacamos al usuario de la pantalla
  }
  window.location.href = "/login";
}
