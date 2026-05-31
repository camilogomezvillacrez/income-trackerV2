import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { category } = await params;
  const { amount } = await req.json();
  const db = getDb();
  await db.execute(
    `INSERT INTO budgets (category, amount, user_id) VALUES (?, ?, ?)
     ON CONFLICT(category, user_id) DO UPDATE SET amount=excluded.amount`,
    [decodeURIComponent(category), amount, user.userId]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ category: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { category } = await params;
  const db = getDb();
  await db.execute(
    "DELETE FROM budgets WHERE category=? AND user_id=?",
    [decodeURIComponent(category), user.userId]
  );
  return NextResponse.json({ ok: true });
}
