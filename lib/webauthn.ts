import type { NextRequest, NextResponse } from "next/server";
import { getDb } from "./db";
import type { SessionData } from "./auth";

export const RP_NAME = "Mis Finanzas";

/*
 * Cookie de aviso "este dispositivo tiene Face ID". No da acceso a nada: le
 * dice al login que muestre la pantalla de bloqueo en vez del formulario, y
 * guarda los IDs de las passkeys para pedírselas a Safari por nombre (así no
 * muestra la hoja "¿Usar llave de acceso?" y va directo a Face ID).
 * Los IDs de credencial no son secretos: sin el Face ID del dueño no sirven.
 */
export const PASSKEY_HINT_COOKIE = "fin_passkey";

const CREDENTIAL_ID = /^[A-Za-z0-9_-]{16,512}$/;

/** IDs de passkey guardados en la cookie de aviso (vacío si es el formato viejo "1"). */
export function readPasskeyHint(value: string | undefined): string[] {
  return (value ?? "").split(",").filter((id) => CREDENTIAL_ID.test(id)).slice(0, 10);
}

export function setPasskeyHint<T extends NextResponse>(res: T, credentialIds: string[]): T {
  const ids = credentialIds.filter((id) => CREDENTIAL_ID.test(id)).slice(0, 10);
  res.cookies.set(PASSKEY_HINT_COOKIE, ids.join(",") || "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 400 * 24 * 60 * 60,
  });
  return res;
}

export function clearPasskeyHint<T extends NextResponse>(res: T): T {
  res.cookies.delete(PASSKEY_HINT_COOKIE);
  return res;
}

/** El RP ID es el dominio donde corre la app (localhost en dev, el de Vercel en prod). */
export function relyingParty(req: NextRequest) {
  return { rpID: req.nextUrl.hostname, origin: req.nextUrl.origin };
}

export interface StoredCredential {
  id: string;
  publicKey: string;
  counter: number;
  transports: string[] | undefined;
}

export async function getCredentials(userId: number): Promise<StoredCredential[]> {
  const res = await getDb().execute(
    "SELECT id, public_key, counter, transports FROM webauthn_credentials WHERE user_id=?",
    [userId]
  );
  return res.rows.map((r) => ({
    id: String(r.id),
    publicKey: String(r.public_key),
    counter: Number(r.counter),
    transports: r.transports ? String(r.transports).split(",") : undefined,
  }));
}

/** Credencial + dueño, para entrar con Face ID sin sesión previa. */
export async function getCredentialById(id: string) {
  const res = await getDb().execute(
    `SELECT c.id, c.user_id, c.public_key, c.counter, c.transports, u.email
     FROM webauthn_credentials c JOIN users u ON u.id = c.user_id
     WHERE c.id=?`,
    [id]
  );
  const r = res.rows[0];
  if (!r) return null;
  return {
    id: String(r.id),
    userId: Number(r.user_id),
    email: String(r.email),
    publicKey: String(r.public_key),
    counter: Number(r.counter),
    transports: r.transports ? String(r.transports).split(",") : undefined,
  };
}

/** Si la tabla aún no existe (migración sin correr) se trata como "sin Face ID". */
export async function userHasPasskey(userId: number): Promise<boolean> {
  try {
    const res = await getDb().execute(
      "SELECT 1 FROM webauthn_credentials WHERE user_id=? LIMIT 1",
      [userId]
    );
    return res.rows.length > 0;
  } catch {
    return false;
  }
}


/* ── Retos WebAuthn ────────────────────────────────────────────
 * Se guardan varios, no uno.
 *
 * Habia una sola casilla y tres flujos escribiendo en ella (desbloqueo, login y
 * alta de Face ID); ademas la pantalla de bloqueo vuelve a pedir opciones al
 * reintentar y al volver de otra app. Si llegaban dos peticiones antes de
 * verificar, la segunda pisaba a la primera: la cara firmaba un reto que el
 * servidor ya habia olvidado y salia "Unexpected authentication response
 * challenge". Face ID habia funcionado; el descuadre era del servidor.
 *
 * Aceptar los ultimos retos no afloja la seguridad: cada uno se sigue usando
 * una sola vez, siguen siendo aleatorios y la lista se borra entera al
 * verificar. */
const MAX_RETOS = 3;

/** Todos los retos vivos, incluido el del formato viejo. */
function retosDe(session: SessionData): string[] {
  if (session.challenges?.length) return session.challenges;
  return session.challenge ? [session.challenge] : [];
}

export function rememberChallenge(session: SessionData, challenge: string): void {
  const previos = retosDe(session).filter((c) => c !== challenge);
  session.challenges = [challenge, ...previos].slice(0, MAX_RETOS);
  session.challenge = challenge;
}

/** Comprobador para expectedChallenge, o null si no hay ninguno pendiente. */
export function challengeMatcher(session: SessionData): ((c: string) => boolean) | null {
  const retos = retosDe(session);
  if (retos.length === 0) return null;
  return (c: string) => retos.includes(c);
}

export function clearChallenges(session: SessionData): void {
  session.challenges = undefined;
  session.challenge = undefined;
}
