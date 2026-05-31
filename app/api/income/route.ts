import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { todayDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { amount, category, subcategory, note, date } = await req.json();
  const db = getDb();
  await db.execute(
    `INSERT INTO incomes (amount, category, subcategory, note, date, created_at, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [amount, category, subcategory ?? null, note ?? null, date ?? todayDate(), new Date().toISOString(), user.userId]
  );
  return NextResponse.json({ ok: true });
}
