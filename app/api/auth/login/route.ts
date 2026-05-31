import { NextRequest, NextResponse } from "next/server";
import { compareSync } from "bcryptjs";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // ── Rate limiting por IP ────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    const mins = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return NextResponse.json(
      { error: `Demasiados intentos. Intenta en ${mins} minutos.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 0) / 1000)) } }
    );
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }

  const db = getDb();
  const res = await db.execute(
    "SELECT id, password_hash FROM users WHERE email = ?",
    [email.toLowerCase().trim()]
  );

  const user = res.rows[0];

  // Siempre comparar (timing attack mitigation): si no hay usuario, comparar un hash dummy
  const hash = user ? String(user.password_hash) : "$2b$10$dummyhashtopreventtimingattack.XXXXXXXXXXX";
  const valid = user ? compareSync(password, hash) : false;

  if (!valid) {
    return NextResponse.json({ error: "Email o contraseña incorrectos" }, { status: 401 });
  }

  // Login correcto → resetear contador
  resetRateLimit(ip);

  const session = await getSession();
  session.userId = Number(user!.id);
  session.email  = email.toLowerCase().trim();
  await session.save();

  return NextResponse.json({ ok: true });
}
