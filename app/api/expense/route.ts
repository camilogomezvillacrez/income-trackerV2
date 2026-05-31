import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { todayDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { amount, category, subcategory, note, date, payment_method } = await req.json();
  const db = getDb();
  await db.execute(
    `INSERT INTO expenses (amount, category, subcategory, note, date, created_at, payment_method, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [amount, category, subcategory ?? null, note ?? null, date ?? todayDate(), new Date().toISOString(), payment_method ?? "Efectivo", user.userId]
  );
  return NextResponse.json({ ok: true });
}
