import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/** Crear un gasto fijo */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const name = String(body.name ?? "").trim();
  const amount = Number(body.amount);
  const category = String(body.category ?? "General");
  const day = Math.min(Math.max(parseInt(String(body.day_of_month ?? 1), 10) || 1, 1), 31);

  if (!name) {
    return NextResponse.json({ error: "Ponle un nombre al gasto fijo" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
  }

  const db = getDb();
  await db.execute(
    `INSERT INTO fixed_expenses
       (user_id, name, amount, category, subcategory, day_of_month, payment_method, active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)`,
    [
      user.userId,
      name,
      amount,
      category,
      body.subcategory ? String(body.subcategory) : null,
      day,
      body.payment_method ? String(body.payment_method) : "Efectivo",
      new Date().toISOString(),
    ]
  );

  return NextResponse.json({ ok: true });
}
