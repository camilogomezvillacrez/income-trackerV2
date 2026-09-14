import { NextResponse } from "next/server";
import { getAuthUser, getSession, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { clearPasskeyHint } from "@/lib/webauthn";

/** Desactiva Face ID: borra todas las passkeys del usuario. */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  await getDb().execute("DELETE FROM webauthn_credentials WHERE user_id=?", [user.userId]);

  const session = await getSession();
  session.hasPasskey = false;
  await session.save();

  return clearPasskeyHint(NextResponse.json({ ok: true }));
}
