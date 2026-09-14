import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";

/** Guarda la suscripción de este dispositivo (si ya existía, pasa al usuario actual). */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const sub = await req.json().catch(() => null);
  const endpoint = sub?.endpoint;
  const p256dh   = sub?.keys?.p256dh;
  const auth     = sub?.keys?.auth;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://") || !p256dh || !auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });
  }

  await getDb().execute(
    `INSERT INTO push_subscriptions (endpoint, user_id, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id, p256dh=excluded.p256dh, auth=excluded.auth`,
    [endpoint, user.userId, String(p256dh), String(auth), new Date().toISOString()]
  );
  return NextResponse.json({ ok: true });
}

/** Quita la suscripción de este dispositivo. */
export async function DELETE(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { endpoint } = await req.json().catch(() => ({}));
  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Falta endpoint" }, { status: 400 });
  }

  await getDb().execute(
    "DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?",
    [endpoint, user.userId]
  );
  return NextResponse.json({ ok: true });
}
