import { NextRequest, NextResponse } from "next/server";
import type { InStatement } from "@libsql/client";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { rowToCategory, validateCategoryInput } from "@/lib/categories";

type Params = { params: Promise<{ id: string }> };

async function loadCategory(userId: number, id: string) {
  const res = await getDb().execute(
    "SELECT id, tipo, name, grupo, icon, color, subcategories, position FROM categories WHERE id=? AND user_id=?",
    [Number(id), userId]
  );
  return res.rows[0] ? rowToCategory(res.rows[0]) : null;
}

/**
 * Cuántos registros usa cada subcategoría de esta categoría. El editor lo pide
 * al abrir, para poder avisar antes de que quites una que sí tiene gastos.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const current = await loadCategory(user.userId, (await params).id);
  if (!current) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const movTable = current.tipo === "ingreso" ? "incomes" : "expenses";
  const sql = current.tipo === "gasto"
    ? `SELECT subcategory AS name, COUNT(*) AS n FROM (
         SELECT subcategory FROM expenses       WHERE user_id=? AND category=? AND subcategory IS NOT NULL
         UNION ALL
         SELECT subcategory FROM fixed_expenses WHERE user_id=? AND category=? AND subcategory IS NOT NULL
       ) GROUP BY subcategory`
    : `SELECT subcategory AS name, COUNT(*) AS n FROM ${movTable}
       WHERE user_id=? AND category=? AND subcategory IS NOT NULL GROUP BY subcategory`;
  const args = current.tipo === "gasto"
    ? [user.userId, current.name, user.userId, current.name]
    : [user.userId, current.name];

  const res = await getDb().execute(sql, args);
  const usage: Record<string, number> = {};
  for (const r of res.rows) usage[String(r.name)] = Number(r.n);

  return NextResponse.json({ usage });
}

/**
 * Edita nombre, ícono, color y subcategorías. Los movimientos, presupuestos y
 * gastos fijos guardan el NOMBRE, así que un renombre los actualiza en el
 * mismo lote (y subRenames hace lo propio con las subcategorías).
 *
 * Si una subcategoría desaparece de la lista, sus registros NO pueden quedar
 * apuntando a una etiqueta que ya no existe: `subMoves` dice a cuál pasarlos y,
 * si no viene, se quedan sin subcategoría.
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const current = await loadCategory(user.userId, (await params).id);
  if (!current) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const input = validateCategoryInput(body);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });

  const db = getDb();
  const uid = user.userId;

  if (input.name.toLowerCase() !== current.name.toLowerCase()) {
    const dup = await db.execute(
      "SELECT 1 FROM categories WHERE user_id=? AND tipo=? AND name=? COLLATE NOCASE AND id<>?",
      [uid, current.tipo, input.name, current.id]
    );
    if (dup.rows.length) {
      return NextResponse.json({ error: `Ya tienes una categoría llamada "${input.name}"` }, { status: 409 });
    }
  }

  const movTable = current.tipo === "ingreso" ? "incomes" : "expenses";
  const stmts: InStatement[] = [
    {
      sql: "UPDATE categories SET name=?, grupo=?, icon=?, color=?, subcategories=? WHERE id=? AND user_id=?",
      args: [
        input.name, current.tipo === "gasto" ? input.grupo : "",
        input.icon, input.color, JSON.stringify(input.subs), current.id, uid,
      ],
    },
  ];

  if (input.name !== current.name) {
    stmts.push({ sql: `UPDATE ${movTable} SET category=? WHERE user_id=? AND category=?`, args: [input.name, uid, current.name] });
    if (current.tipo === "gasto") {
      stmts.push({ sql: "UPDATE fixed_expenses SET category=? WHERE user_id=? AND category=?", args: [input.name, uid, current.name] });
      stmts.push({ sql: "UPDATE budgets SET category=? WHERE user_id=? AND category=?", args: [input.name, uid, current.name] });
    }
  }

  const renames = body?.subRenames && typeof body.subRenames === "object"
    ? Object.entries(body.subRenames as Record<string, unknown>).slice(0, 40)
    : [];
  if (current.tipo === "gasto") {
    for (const [from, to] of renames) {
      const next = typeof to === "string" ? to.trim() : "";
      if (!next || next === from || !input.subs.some((s) => s.name === next)) continue;
      stmts.push({
        sql: "UPDATE expenses SET subcategory=? WHERE user_id=? AND category=? AND subcategory=?",
        args: [next, uid, input.name, from],
      });
      stmts.push({
        sql: "UPDATE fixed_expenses SET subcategory=? WHERE user_id=? AND category=? AND subcategory=?",
        args: [next, uid, input.name, from],
      });
    }
  }

  // Subcategorías que desaparecen: sus registros se mueven a donde diga
  // subMoves, o se quedan sin subcategoría. Va al final, cuando los renombres
  // ya se aplicaron, para no reubicar algo que en realidad solo cambió de nombre.
  const renamedFrom = new Set(renames.map(([from]) => from));
  const moves = body?.subMoves && typeof body.subMoves === "object"
    ? (body.subMoves as Record<string, unknown>)
    : {};

  for (const gone of current.subs) {
    if (input.subs.some((s) => s.name === gone.name) || renamedFrom.has(gone.name)) continue;
    const raw = typeof moves[gone.name] === "string" ? String(moves[gone.name]).trim() : "";
    const dest = input.subs.some((s) => s.name === raw) ? raw : null;
    stmts.push({
      sql: `UPDATE ${movTable} SET subcategory=? WHERE user_id=? AND category=? AND subcategory=?`,
      args: [dest, uid, input.name, gone.name],
    });
    if (current.tipo === "gasto") {
      stmts.push({
        sql: "UPDATE fixed_expenses SET subcategory=? WHERE user_id=? AND category=? AND subcategory=?",
        args: [dest, uid, input.name, gone.name],
      });
    }
  }

  await db.batch(stmts, "write");
  return NextResponse.json({ ok: true });
}

/**
 * Borra una categoría. Si tiene movimientos, gastos fijos o presupuesto,
 * responde 409 con el conteo y las opciones; el cliente vuelve a llamar con
 * { moveTo } para pasarlos a otra categoría antes de borrarla.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const current = await loadCategory(user.userId, (await params).id);
  if (!current) return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const moveTo = typeof body?.moveTo === "string" ? body.moveTo : null;

  const db = getDb();
  const uid = user.userId;
  const isGasto = current.tipo === "gasto";
  const movTable = isGasto ? "expenses" : "incomes";

  const [siblingsRes, usageRes] = await db.batch([
    {
      sql: "SELECT name FROM categories WHERE user_id=? AND tipo=? AND id<>? ORDER BY position, id",
      args: [uid, current.tipo, current.id],
    },
    {
      sql: `SELECT
              (SELECT COUNT(*) FROM ${movTable} WHERE user_id=? AND category=?) AS movements,
              (SELECT COUNT(*) FROM fixed_expenses WHERE user_id=? AND category=?) AS fixed,
              (SELECT COUNT(*) FROM budgets WHERE user_id=? AND category=?) AS budget`,
      args: [uid, current.name, uid, current.name, uid, current.name],
    },
  ], "read");

  const siblings = siblingsRes.rows.map((r) => String(r.name));
  if (siblings.length === 0) {
    return NextResponse.json(
      { error: `Debe quedar al menos una categoría de ${isGasto ? "gastos" : "ingresos"}` },
      { status: 400 }
    );
  }

  const u = usageRes.rows[0];
  const inUse = {
    movements: Number(u?.movements ?? 0),
    fixed: isGasto ? Number(u?.fixed ?? 0) : 0,
    budget: isGasto ? Number(u?.budget ?? 0) : 0,
  };
  const used = inUse.movements + inUse.fixed + inUse.budget > 0;

  if (used && !moveTo) {
    return NextResponse.json(
      { error: "La categoría tiene registros", inUse, options: siblings },
      { status: 409 }
    );
  }

  const stmts: InStatement[] = [];
  if (used) {
    if (!moveTo || !siblings.includes(moveTo)) {
      return NextResponse.json({ error: "Elige una categoría de destino válida" }, { status: 400 });
    }
    // Las subcategorías no existen en la categoría destino: se limpian
    stmts.push({
      sql: `UPDATE ${movTable} SET category=?, subcategory=NULL WHERE user_id=? AND category=?`,
      args: [moveTo, uid, current.name],
    });
    if (isGasto) {
      stmts.push({
        sql: "UPDATE fixed_expenses SET category=?, subcategory=NULL WHERE user_id=? AND category=?",
        args: [moveTo, uid, current.name],
      });
      // Si el destino ya tiene presupuesto, gana el suyo; si no, hereda este
      stmts.push({
        sql: `DELETE FROM budgets WHERE user_id=? AND category=?
              AND EXISTS (SELECT 1 FROM budgets b WHERE b.user_id=? AND b.category=?)`,
        args: [uid, current.name, uid, moveTo],
      });
      stmts.push({
        sql: "UPDATE budgets SET category=? WHERE user_id=? AND category=?",
        args: [moveTo, uid, current.name],
      });
    }
  }
  stmts.push({ sql: "DELETE FROM categories WHERE id=? AND user_id=?", args: [current.id, uid] });

  await db.batch(stmts, "write");
  return NextResponse.json({ ok: true });
}
