import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SESSION_IDLE_MS, type SessionData } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login", "/register", "/api/auth/login", "/api/auth/register",
  // Desbloqueo con Face ID: la app está bloqueada, la ruta valida la sesión por su cuenta
  "/api/auth/webauthn/authenticate",
  // Atajo de Apple Wallet: se autentica con token propio, no con cookie
  "/api/shortcut/expense",
  "/sw.js", "/manifest.webmanifest",
];

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

  // ── Bloqueo por inactividad ─────────────────────────────────
  const now = Date.now();
  const last = session.lastActivity ?? now;

  if (now - last > SESSION_IDLE_MS) {
    // Inactiva: la sesión NO se borra aquí. La API responde "bloqueada" (ninguna
    // ruta de datos acepta una sesión inactiva) y la página decide, mirando la
    // base de datos, si pide Face ID o manda al login.
    return isApi
      ? NextResponse.json({ error: "Bloqueada", locked: true }, { status: 401 })
      : NextResponse.next();
  }

  // El sondeo automático cada 60s va marcado y NO renueva la sesión;
  // así la inactividad real del usuario sí llega a vencer.
  const isBackgroundPoll = req.headers.get("x-bg-poll") === "1";

  // Las rutas de Face ID guardan su propia sesión (reto, marca de passkey):
  // si el proxy también la guardara, una cookie podría pisar a la otra.
  const writesOwnSession = pathname.startsWith("/api/auth/webauthn");

  // Se guarda como mucho una vez cada 30s para no re-cifrar en cada request.
  if (!isBackgroundPoll && !writesOwnSession && now - last > 30_000) {
    session.lastActivity = now;
    await session.save();
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:png|jpg|jpeg|gif|svg|webp|avif|ico)$).*)"],
};
