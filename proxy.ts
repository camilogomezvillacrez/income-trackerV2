import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SESSION_IDLE_MS, type SessionData } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/register", "/api/auth/login", "/api/auth/register"];

/** Corta la sesión: borra la cookie y manda al login (o 401 si es una API). */
function endSession(req: NextRequest, isApi: boolean) {
  const res = isApi
    ? NextResponse.json({ error: "Sesión expirada" }, { status: 401 })
    : NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete(sessionOptions.cookieName);
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);

  if (!session.userId) return endSession(req, isApi);

  // ── Cierre por inactividad ──────────────────────────────────
  const now = Date.now();
  const last = session.lastActivity ?? now;

  if (now - last > SESSION_IDLE_MS) {
    return endSession(req, isApi);
  }

  // El sondeo automático cada 60s va marcado y NO renueva la sesión;
  // así la inactividad real del usuario sí llega a vencer.
  const isBackgroundPoll = req.headers.get("x-bg-poll") === "1";

  // Se guarda como mucho una vez cada 30s para no re-cifrar en cada request.
  if (!isBackgroundPoll && now - last > 30_000) {
    session.lastActivity = now;
    await session.save();
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
