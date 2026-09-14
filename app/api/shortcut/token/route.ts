import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateShortcutToken } from "@/lib/shortcutToken";

/** ¿El atajo de Wallet está activo? */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const res = await getDb().execute(
    "SELECT shortcut_token_hash FROM users WHERE id=?",
    [user.userId]
  );
  return NextResponse.json({ active: !!res.rows[0]?.shortcut_token_hash });
}

/** Genera un token nuevo (invalida el anterior) y lo devuelve una sola vez. */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { token, hash } = generateShortcutToken();
  await getDb().execute(
    "UPDATE users SET shortcut_token_hash=? WHERE id=?",
    [hash, user.userId]
  );
  return NextResponse.json({ token });
}

/** Revoca el token: el atajo deja de funcionar. */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  await getDb().execute(
    "UPDATE users SET shortcut_token_hash=NULL WHERE id=?",
    [user.userId]
  );
  return NextResponse.json({ ok: true });
}
