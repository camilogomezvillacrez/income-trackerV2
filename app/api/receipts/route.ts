import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { rowToReceipt } from "@/lib/receipts";
import { todayDate } from "@/lib/utils";

/** Lista de recibos del usuario, opcionalmente filtrada por texto o por mes. */
export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  const month = req.nextUrl.searchParams.get("month") ?? "";

  const where = ["user_id = ?"];
  const args: (string | number)[] = [user.userId];

  if (q) {
    where.push("(proveedor LIKE ? OR nit LIKE ? OR correo LIKE ? OR telefono LIKE ?)");
    args.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (/^\d{4}-\d{2}$/.test(month)) {
    where.push("substr(fecha, 1, 7) = ?");
    args.push(month);
  }

  const db = getDb();
  const res = await db.execute(
    `SELECT * FROM receipts WHERE ${where.join(" AND ")} ORDER BY date(fecha) DESC, id DESC LIMIT 300`,
    args
  );
  return NextResponse.json({ receipts: res.rows.map(rowToReceipt) });
}

/**
 * Guarda el recibo confirmado por el usuario: crea el gasto en la contabilidad
 * y el registro del recibo enlazado a ese gasto.
 */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const b = await req.json();
  const pathname = String(b.pathname ?? "");

  // La foto tiene que ser una que este mismo usuario acabe de subir.
  if (!pathname.startsWith(`receipts/${user.userId}/`)) {
    return NextResponse.json({ error: "Imagen inválida" }, { status: 400 });
  }

  const valor = Number(b.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: "El valor debe ser mayor a cero" }, { status: 400 });
  }
  const category = String(b.category ?? "").trim();
  if (!category) {
    return NextResponse.json({ error: "Falta la categoría" }, { status: 400 });
  }

  const fecha = /^\d{4}-\d{2}-\d{2}$/.test(String(b.fecha)) ? String(b.fecha) : todayDate();
  const str = (v: unknown, max = 200) => {
    const s = String(v ?? "").trim();
    return s ? s.slice(0, max) : null;
  };

  const db = getDb();
  const now = new Date().toISOString();

  const expense = await db.execute(
    `INSERT INTO expenses (amount, category, subcategory, note, date, created_at, payment_method, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      valor,
      category,
      str(b.subcategory, 60),
      str(b.nota, 200) ?? str(b.proveedor, 200),
      fecha,
      now,
      str(b.payment_method, 40) ?? "Efectivo",
      user.userId,
    ]
  );
  const expenseId = Number(expense.lastInsertRowid);

  await db.execute(
    `INSERT INTO receipts (user_id, expense_id, image_url, proveedor, nit, valor, correo, telefono, fecha, categoria, raw_ai_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.userId,
      expenseId,
      pathname,
      str(b.proveedor),
      str(b.nit, 40),
      valor,
      str(b.correo, 120),
      str(b.telefono, 40),
      fecha,
      category,
      b.raw ? JSON.stringify(b.raw).slice(0, 20000) : null,
      now,
    ]
  );

  return NextResponse.json({ ok: true, expenseId });
}
