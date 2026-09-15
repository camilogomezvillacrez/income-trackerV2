import { NextRequest, NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/**
 * Borra el recibo y su foto. El gasto en la contabilidad queda: se elimina
 * aparte desde Movimientos, para no perder un registro contable sin querer.
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();

  const res = await db.execute("SELECT image_url FROM receipts WHERE id=? AND user_id=?", [id, user.userId]);
  if (res.rows.length === 0) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }

  await db.execute("DELETE FROM receipts WHERE id=? AND user_id=?", [id, user.userId]);

  try {
    await del(String(res.rows[0].image_url));
  } catch {
    // La fila ya no está; un blob huérfano no rompe nada.
  }

  return NextResponse.json({ ok: true });
}
