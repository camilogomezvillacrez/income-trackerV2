import type { NextRequest, NextResponse } from "next/server";
import { getDb } from "./db";

export const RP_NAME = "Mis Finanzas";

/*
 * Cookie de aviso "este dispositivo tiene Face ID". No da acceso a nada: solo
 * le dice al login que muestre la pantalla de bloqueo en vez del formulario,
 * aunque la cookie de sesión se haya perdido.
 */
export const PASSKEY_HINT_COOKIE = "fin_passkey";

export function setPasskeyHint<T extends NextResponse>(res: T): T {
  res.cookies.set(PASSKEY_HINT_COOKIE, "1", {
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
