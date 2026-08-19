import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface SessionData {
  userId: number;
  email: string;
  /** Momento de la última acción real del usuario (ms). */
  lastActivity?: number;
}

/**
 * Inactividad máxima antes de cerrar la sesión.
 * El sondeo automático en segundo plano no cuenta como actividad.
 */
export const SESSION_IDLE_MS = 5 * 60 * 1000;

export const sessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "finanzas-secret-changeme-at-least-32-chars!!",
  cookieName: "fin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: Math.floor(SESSION_IDLE_MS / 1000),
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getAuthUser(): Promise<{ userId: number; email: string } | null> {
  const session = await getSession();
  if (!session.userId) return null;

  // Defensa en profundidad: el proxy ya filtra por inactividad, pero las
  // rutas también lo verifican por si la cookie llega por otro camino.
  if (session.lastActivity && Date.now() - session.lastActivity > SESSION_IDLE_MS) {
    return null;
  }

  return { userId: session.userId, email: session.email };
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
