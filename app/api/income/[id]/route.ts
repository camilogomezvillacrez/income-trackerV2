import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { amount, category, subcategory, note, date } = await req.json();
  const db = getDb();
  await db.execute(
    `UPDATE incomes SET amount=?, category=?, subcategory=?, note=?, date=?
     WHERE id=? AND user_id=?`,
    [amount, category, subcategory ?? null, note ?? null, date, id, user.userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();
  await db.execute("DELETE FROM incomes WHERE id=? AND user_id=?", [id, user.userId]);
  return NextResponse.json({ ok: true });
}
