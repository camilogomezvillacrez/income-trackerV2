import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export interface SessionData {
  userId: number;
  email: string;
}

const sessionOptions = {
  password:
    process.env.SESSION_SECRET ??
    "finanzas-secret-changeme-at-least-32-chars!!",
  cookieName: "fin_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function getAuthUser(): Promise<{ userId: number; email: string } | null> {
  const session = await getSession();
  if (!session.userId) return null;
  return { userId: session.userId, email: session.email };
}

export function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}
