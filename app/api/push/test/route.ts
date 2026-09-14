import { NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

/** Notificación de prueba a todos los dispositivos del usuario. */
export async function POST() {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const sent = await sendPushToUser(user.userId, {
    // Sin repetir el nombre de la app: iOS ya añade "from <nombre>" debajo del título
    title: "✓ Notificaciones activadas",
    body: "Así te llegarán los avisos de tus gastos automáticos",
    tag: "test",
  });
  return NextResponse.json({ sent });
}
