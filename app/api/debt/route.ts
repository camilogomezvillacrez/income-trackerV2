import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const person = String(body.person ?? "").trim();
  const type = body.type === "me_deben" ? "me_deben" : "debo";
  const amount = Number(body.amount);
  const paid = Number(body.paid) || 0;

  if (!person) {
    return NextResponse.json({ error: "Falta el nombre de la persona" }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "El monto debe ser mayor a cero" }, { status: 400 });
  }

  const date = String(body.date ?? new Date().toISOString().slice(0, 10));
  const dueDate = body.due_date ? String(body.due_date) : null;
  const description = body.description ? String(body.description).trim() : null;

  const db = getDb();
  await db.execute(
    `INSERT INTO debts (user_id, person, type, amount, paid, description, date, due_date, completed, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.userId,
      person,
      type,
      amount,
      Math.min(paid, amount),
      description,
      date,
      dueDate,
      paid >= amount ? 1 : 0,
      new Date().toISOString(),
    ]
  );

  return NextResponse.json({ ok: true });
}
