import { NextRequest, NextResponse } from "next/server";
import { hashSync } from "bcryptjs";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password, name, inviteToken } = await req.json();

  // ── Token de invitación (si REGISTRATION_TOKEN está definido) ──
  const requiredToken = process.env.REGISTRATION_TOKEN;
  if (requiredToken) {
    if (!inviteToken || inviteToken !== requiredToken) {
      return NextResponse.json(
        { error: "Token de invitación incorrecto" },
        { status: 403 }
      );
    }
  }

  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  const db = getDb();
  const existing = await db.execute(
    "SELECT id FROM users WHERE email = ?",
    [email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: "Este email ya está registrado" }, { status: 409 });
  }

  const hash = hashSync(password, 10);
  const res = await db.execute(
    "INSERT INTO users (email, password_hash, name, created_at) VALUES (?, ?, ?, ?)",
    [email.toLowerCase().trim(), hash, name || email.split("@")[0], new Date().toISOString()]
  );

  const userId = Number(res.lastInsertRowid);
  const session = await getSession();
  session.userId = userId;
  session.email  = email.toLowerCase().trim();
  await session.save();

  return NextResponse.json({ ok: true });
}
