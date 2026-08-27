import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/** Editar una deuda */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const res = await db.execute("SELECT * FROM debts WHERE id=? AND user_id=?", [id, user.userId]);
  const debt = res.rows[0];
  if (!debt) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const person = body.person !== undefined ? String(body.person).trim() : String(debt.person);
  const amount = body.amount !== undefined ? Number(body.amount) : Number(debt.amount);
  const type = body.type !== undefined
    ? (body.type === "me_deben" ? "me_deben" : "debo")
    : String(debt.type);

  if (!person) {
    return NextResponse.json({ error: "Falta el nombre de la persona" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
  }

  const description = body.description !== undefined
    ? (body.description ? String(body.description).trim() : null)
    : (debt.description ?? null);
  const dueDate = body.due_date !== undefined
    ? (body.due_date ? String(body.due_date) : null)
    : (debt.due_date ?? null);

  const paid = Number(debt.paid);

  await db.execute(
    `UPDATE debts SET person=?, type=?, amount=?, description=?, due_date=?, completed=?
     WHERE id=? AND user_id=?`,
    [person, type, amount, description, dueDate, paid >= amount ? 1 : 0, id, user.userId]
  );

  return NextResponse.json({ ok: true });
}

/** Eliminar una deuda y sus abonos */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const db = getDb();
  await db.execute("DELETE FROM debt_payments WHERE debt_id=? AND user_id=?", [id, user.userId]);
  await db.execute("DELETE FROM debts WHERE id=? AND user_id=?", [id, user.userId]);
  return NextResponse.json({ ok: true });
}
