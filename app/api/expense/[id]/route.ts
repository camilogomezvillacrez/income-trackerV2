import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { amount, category, subcategory, note, date, payment_method } = await req.json();
  const db = getDb();
  await db.execute(
    `UPDATE expenses SET amount=?, category=?, subcategory=?, note=?, date=?, payment_method=?
     WHERE id=? AND user_id=?`,
    [amount, category, subcategory ?? null, note ?? null, date, payment_method ?? "Efectivo", id, user.userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();
  await db.execute("DELETE FROM expenses WHERE id=? AND user_id=?", [id, user.userId]);
  return NextResponse.json({ ok: true });
}
