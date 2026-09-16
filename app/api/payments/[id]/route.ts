import { NextRequest, NextResponse } from "next/server";
import type { InStatement } from "@libsql/client";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rowToPayment, validatePaymentInput } from "@/lib/paymentMethods";

type Params = { params: Promise<{ id: string }> };

async function loadPayment(userId: number, id: string) {
  const res = await getDb().execute(
    "SELECT id, name, emoji, short, kind, last4, position FROM payment_methods WHERE id=? AND user_id=?",
    [Number(id), userId]
  );
  return res.rows[0] ? rowToPayment(res.rows[0]) : null;
}

/**
 * Edita nombre, emoji, nombre corto, tipo y dígitos. Los gastos y los gastos
 * fijos guardan el NOMBRE del medio, así que un renombre los actualiza en el
 * mismo lote.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const current = await loadPayment(user.userId, (await params).id);
  if (!current) return NextResponse.json({ error: "Medio de pago no encontrado" }, { status: 404 });

  const input = validatePaymentInput(await req.json().catch(() => null));
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  const db = getDb();
  const uid = user.userId;

  if (input.name.toLowerCase() !== current.name.toLowerCase()) {
    const dup = await db.execute(
      "SELECT 1 FROM payment_methods WHERE user_id=? AND name=? COLLATE NOCASE AND id<>?",
      [uid, input.name, current.id]
    );
    if (dup.rows.length) {
      return NextResponse.json({ error: `Ya tienes un medio llamado "${input.name}"` }, { status: 409 });
    }
  }

  const stmts: InStatement[] = [
    {
      sql: "UPDATE payment_methods SET name=?, emoji=?, short=?, kind=?, last4=? WHERE id=? AND user_id=?",
      args: [input.name, input.emoji, input.short, input.kind, input.last4, current.id, uid],
    },
  ];
  if (input.name !== current.name) {
    stmts.push({
      sql: "UPDATE expenses SET payment_method=? WHERE user_id=? AND payment_method=?",
      args: [input.name, uid, current.name],
    });
    stmts.push({
      sql: "UPDATE fixed_expenses SET payment_method=? WHERE user_id=? AND payment_method=?",
      args: [input.name, uid, current.name],
    });
  }

  await db.batch(stmts, "write");
  return NextResponse.json({ ok: true });
}

/**
 * Borra un medio de pago. Si tiene gastos o gastos fijos, responde 409 con el
 * conteo y las opciones; el cliente vuelve a llamar con { moveTo } para pasarlos
 * a otro medio antes de borrarlo.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const current = await loadPayment(user.userId, (await params).id);
  if (!current) return NextResponse.json({ error: "Medio de pago no encontrado" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const moveTo = typeof body?.moveTo === "string" ? body.moveTo : null;

  const db = getDb();
  const uid = user.userId;

  const [siblingsRes, usageRes] = await db.batch([
    {
      sql: "SELECT name FROM payment_methods WHERE user_id=? AND id<>? ORDER BY position, id",
      args: [uid, current.id],
    },
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM expenses WHERE user_id=? AND payment_method=?) AS movements,
              (SELECT COUNT(*) FROM fixed_expenses WHERE user_id=? AND payment_method=?) AS fixed`,
      args: [uid, current.name, uid, current.name],
    },
  ], "read");

  const siblings = siblingsRes.rows.map((r) => String(r.name));
  if (siblings.length === 0) {
    return NextResponse.json({ error: "Debe quedar al menos un medio de pago" }, { status: 400 });
  }

  const u = usageRes.rows[0];
  const inUse = { movements: Number(u?.movements ?? 0), fixed: Number(u?.fixed ?? 0) };
  const used = inUse.movements + inUse.fixed > 0;

  if (used && !moveTo) {
    return NextResponse.json(
      { error: "El medio de pago tiene registros", inUse, options: siblings },
      { status: 409 }
    );
  }

  const stmts: InStatement[] = [];
  if (used) {
    if (!moveTo || !siblings.includes(moveTo)) {
      return NextResponse.json({ error: "Elige un medio de destino válido" }, { status: 400 });
    }
    stmts.push({
      sql: "UPDATE expenses SET payment_method=? WHERE user_id=? AND payment_method=?",
      args: [moveTo, uid, current.name],
    });
    stmts.push({
      sql: "UPDATE fixed_expenses SET payment_method=? WHERE user_id=? AND payment_method=?",
      args: [moveTo, uid, current.name],
    });
  }
  stmts.push({ sql: "DELETE FROM payment_methods WHERE id=? AND user_id=?", args: [current.id, uid] });

  await db.batch(stmts, "write");
  return NextResponse.json({ ok: true });
}
