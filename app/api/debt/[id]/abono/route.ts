import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

/** Registrar un abono a una deuda */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const res = await db.execute(
    "SELECT amount, paid FROM debts WHERE id=? AND user_id=?",
    [id, user.userId]
  );
  const debt = res.rows[0];
  if (!debt) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const amountTotal = Number(debt.amount);
  const paidBefore = Number(debt.paid);
  const pending = Math.max(amountTotal - paidBefore, 0);

  // "saldar" abona todo lo que falte de una
  const raw = body.saldar ? pending : Number(body.amount);

  if (!Number.isFinite(raw) || raw <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
  }

  // Nunca abonar más de lo que falta
  const amount = Math.min(raw, pending);
  if (amount <= 0) {
    return NextResponse.json({ error: "Esta deuda ya está saldada" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const date = String(body.date ?? now.slice(0, 10));
  const note = body.note ? String(body.note).trim() : null;

  await db.execute(
    `INSERT INTO debt_payments (debt_id, user_id, amount, date, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, user.userId, amount, date, note, now]
  );

  const paidAfter = paidBefore + amount;
  await db.execute(
    "UPDATE debts SET paid=?, completed=? WHERE id=? AND user_id=?",
    [paidAfter, paidAfter >= amountTotal ? 1 : 0, id, user.userId]
  );

  return NextResponse.json({ ok: true, paid: paidAfter, completed: paidAfter >= amountTotal });
}
