import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getCategories, validateCategoryInput } from "@/lib/categories";

/** Crea una categoría al final de su lista. */
export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json().catch(() => null);
  const tipo = body?.tipo === "ingreso" ? "ingreso" : "gasto";
  const input = validateCategoryInput(body);
  if (typeof input === "string") {
    return NextResponse.json({ error: input }, { status: 400 });
  }

  // Si el usuario aún no tenía categorías, primero se siembran las suyas:
  // si no, la nueva sería la única y las demás nunca se crearían.
  await getCategories(user.userId);

  const db = getDb();
  const dup = await db.execute(
    "SELECT 1 FROM categories WHERE user_id=? AND tipo=? AND name=? COLLATE NOCASE",
    [user.userId, tipo, input.name]
  );
  if (dup.rows.length) {
    return NextResponse.json({ error: `Ya tienes una categoría llamada "${input.name}"` }, { status: 409 });
  }

  await db.execute(
    `INSERT INTO categories (user_id, tipo, name, icon, color, subcategories, position, created_at)
     VALUES (?, ?, ?, ?, ?, ?,
       (SELECT COALESCE(MAX(position), -1) + 1 FROM categories WHERE user_id=? AND tipo=?), ?)`,
    [
      user.userId, tipo, input.name, input.icon, input.color, JSON.stringify(input.subs),
      user.userId, tipo, new Date().toISOString(),
    ]
  );

  return NextResponse.json({ ok: true });
}
