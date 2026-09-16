import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getPaymentMethods, validatePaymentInput } from "@/lib/paymentMethods";

/** Medios de pago del usuario (los siembra si es su primera vez). */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return unauthorized();
  return NextResponse.json({ payment_methods: await getPaymentMethods(user.userId) });
}

/** Crea un medio de pago al final de la lista. */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const input = validatePaymentInput(await req.json().catch(() => null));
  if (typeof input === "string") {
    return NextResponse.json({ error: input }, { status: 400 });
  }

  // Si el usuario aún no tenía medios, primero se siembran los suyos: si no,
  // el nuevo sería el único y los demás nunca se crearían.
  await getPaymentMethods(user.userId);

  const db = getDb();
  const dup = await db.execute(
    "SELECT 1 FROM payment_methods WHERE user_id=? AND name=? COLLATE NOCASE",
    [user.userId, input.name]
  );
  if (dup.rows.length) {
    return NextResponse.json({ error: `Ya tienes un medio llamado "${input.name}"` }, { status: 409 });
  }

  await db.execute(
    `INSERT INTO payment_methods (user_id, name, emoji, short, kind, last4, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?,
       (SELECT COALESCE(MAX(position), -1) + 1 FROM payment_methods WHERE user_id=?), ?)`,
    [
      user.userId, input.name, input.emoji, input.short, input.kind, input.last4,
      user.userId, new Date().toISOString(),
    ]
  );

  return NextResponse.json({ ok: true });
}
