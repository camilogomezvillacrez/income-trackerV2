import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();
  await db.execute("DELETE FROM goals WHERE id=? AND user_id=?", [id, user.userId]);
  return NextResponse.json({ ok: true });
}
