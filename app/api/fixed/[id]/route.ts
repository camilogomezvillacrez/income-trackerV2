import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/** Editar un gasto fijo (incluye activar / pausar) */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const res = await db.execute(
    "SELECT * FROM fixed_expenses WHERE id=? AND user_id=?",
    [id, user.userId]
  );
  const fe = res.rows[0];
  if (!fe) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const name = body.name !== undefined ? String(body.name).trim() : String(fe.name);
  const amount = body.amount !== undefined ? Number(body.amount) : Number(fe.amount);

  if (!name) {
    return NextResponse.json({ error: "Ponle un nombre al gasto fijo" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
  }

  const category = body.category !== undefined ? String(body.category) : String(fe.category);
  const subcategory = body.subcategory !== undefined
    ? (body.subcategory ? String(body.subcategory) : null)
    : (fe.subcategory ?? null);
  const day = body.day_of_month !== undefined
    ? Math.min(Math.max(parseInt(String(body.day_of_month), 10) || 1, 1), 31)
    : Number(fe.day_of_month);
  const paymentMethod = body.payment_method !== undefined
    ? String(body.payment_method)
    : (fe.payment_method ?? "Efectivo");
  const active = body.active !== undefined ? (body.active ? 1 : 0) : Number(fe.active);

  await db.execute(
    `UPDATE fixed_expenses
     SET name=?, amount=?, category=?, subcategory=?, day_of_month=?, payment_method=?, active=?
     WHERE id=? AND user_id=?`,
    [name, amount, category, subcategory, day, paymentMethod, active, id, user.userId]
  );

  return NextResponse.json({ ok: true });
}

/** Borrar el gasto fijo. Los gastos ya registrados NO se tocan. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();

  await db.execute(
    "UPDATE expenses SET fixed_expense_id=NULL WHERE fixed_expense_id=? AND user_id=?",
    [id, user.userId]
  );
  await db.execute("DELETE FROM fixed_expenses WHERE id=? AND user_id=?", [id, user.userId]);

  return NextResponse.json({ ok: true });
}
