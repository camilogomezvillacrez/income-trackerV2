import type { NextRequest } from "next/server";
import { getDb } from "./db";

export const RP_NAME = "Mis Finanzas";

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
