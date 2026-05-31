import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { savings_target } = await req.json();

  if (typeof savings_target !== "number" || savings_target < 0 || savings_target > 100) {
    return NextResponse.json({ error: "La tasa debe ser un número entre 0 y 100" }, { status: 400 });
  }

  const db = getDb();
  await db.execute(
    "UPDATE users SET savings_target=? WHERE id=?",
    [savings_target, user.userId]
  );

  return NextResponse.json({ ok: true });
}
