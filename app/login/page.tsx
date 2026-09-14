import { cookies } from "next/headers";
import { PASSKEY_HINT_COOKIE } from "@/lib/webauthn";
import LoginClient from "./LoginClient";

/*
 * Si este dispositivo tiene Face ID, el login abre directo en la pantalla de
 * bloqueo (decidido en el servidor: sin parpadeo del formulario).
 * ?password=1 fuerza el formulario ("Usar contraseña").
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string }>;
}) {
  const [store, params] = await Promise.all([cookies(), searchParams]);
  const showLock = store.has(PASSKEY_HINT_COOKIE) && params.password !== "1";
  return <LoginClient initialLock={showLock} />;
}
