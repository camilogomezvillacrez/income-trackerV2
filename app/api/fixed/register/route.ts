import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

interface Item {
  id: number;
  /** Monto de este mes; si no viene, se usa el del gasto fijo */
  amount?: number;
}

/**
 * Registra en el mes indicado los gastos fijos seleccionados.
 * Nunca duplica: si ya hay un gasto de ese fijo en el mes, lo salta.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const month = String(body.month ?? "");

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Mes inválido" }, { status: 400 });
  }

  const items: Item[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "No seleccionaste ningún gasto fijo" }, { status: 400 });
  }

  const db = getDb();
  const [year, mon] = month.split("-").map(Number);
  // Día 0 del mes siguiente = último día de este mes
  const lastDay = new Date(Date.UTC(year, mon, 0)).getUTCDate();
  const now = new Date().toISOString();

  let registrados = 0;
  let saltados = 0;

  for (const item of items) {
    const id = Number(item.id);
    if (!Number.isFinite(id)) continue;

    const res = await db.execute(
      "SELECT * FROM fixed_expenses WHERE id=? AND user_id=? AND active=1",
      [id, user.userId]
    );
    const fe = res.rows[0];
    if (!fe) { saltados++; continue; }

    // ¿Ya se registró este mes?
    const dup = await db.execute(
      `SELECT COUNT(*) AS c FROM expenses
       WHERE fixed_expense_id=? AND user_id=? AND substr(date,1,7)=?`,
      [id, user.userId, month]
    );
    if (Number(dup.rows[0].c) > 0) { saltados++; continue; }

    const amount = Number.isFinite(Number(item.amount)) && Number(item.amount) > 0
      ? Number(item.amount)
      : Number(fe.amount);

    const day = Math.min(Number(fe.day_of_month) || 1, lastDay);
    const date = `${month}-${String(day).padStart(2, "0")}`;

    await db.execute(
      `INSERT INTO expenses
         (amount, category, subcategory, note, date, created_at, payment_method, user_id, fixed_expense_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        amount,
        String(fe.category),
        fe.subcategory ? String(fe.subcategory) : null,
        String(fe.name),
        date,
        now,
        fe.payment_method ? String(fe.payment_method) : "Efectivo",
        user.userId,
        id,
      ]
    );
    registrados++;
  }

  return NextResponse.json({ ok: true, registrados, saltados });
}
