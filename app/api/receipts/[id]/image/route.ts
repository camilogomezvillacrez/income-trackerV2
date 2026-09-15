import { NextRequest, NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/**
 * Sirve la foto del recibo. El Blob es privado: nadie llega a la imagen sin
 * pasar por aquí, y aquí solo pasa el dueño del recibo.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();
  const res = await db.execute("SELECT image_url FROM receipts WHERE id=? AND user_id=?", [id, user.userId]);
  if (res.rows.length === 0) {
    return NextResponse.json({ error: "No existe" }, { status: 404 });
  }

  const blob = await get(String(res.rows[0].image_url), { access: "private" });
  if (!blob?.stream) {
    return NextResponse.json({ error: "Imagen no encontrada" }, { status: 404 });
  }

  return new NextResponse(blob.stream, {
    headers: {
      "Content-Type": blob.blob.contentType ?? "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
