import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface SessionData {
  userId: number;
  email: string;
  /** Momento de la última acción real del usuario (ms). */
  lastActivity?: number;
  /** El usuario tiene Face ID (passkey) registrado. */
  hasPasskey?: boolean;
  /** Reto WebAuthn pendiente de verificar. Formato viejo, se sigue leyendo. */
  challenge?: string;
  /** Retos recientes pendientes de verificar, del mas nuevo al mas viejo. */
  challenges?: string[];
}

/**
 * Inactividad máxima antes de BLOQUEAR la app. Con Face ID se desbloquea;
 * sin Face ID toca volver a iniciar sesión.
 * El sondeo automático en segundo plano no cuenta como actividad.
 */
export const SESSION_IDLE_MS = 3 * 60 * 1000;

/** Vida de la cookie: la sesión dura 30 días (renovados con el uso). */
export const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "finanzas-secret-changeme-at-least-32-chars!!",
  cookieName: "fin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_S,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export function isIdle(session: SessionData) {
  return !!session.lastActivity && Date.now() - session.lastActivity > SESSION_IDLE_MS;
}

export async function getAuthUser(): Promise<{ userId: number; email: string } | null> {
  const session = await getSession();
  if (!session.userId) return null;

  // Defensa en profundidad: el proxy ya filtra por inactividad, pero las
  // rutas también lo verifican por si la cookie llega por otro camino.
  if (isIdle(session)) return null;

  return { userId: session.userId, email: session.email };
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
