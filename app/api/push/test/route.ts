import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

/** Notificación de prueba a todos los dispositivos del usuario. */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const sent = await sendPushToUser(user.userId, {
    title: "Mis Finanzas",
    body: "✓ Las notificaciones funcionan en este dispositivo",
    tag: "test",
  });
  return NextResponse.json({ sent });
}
