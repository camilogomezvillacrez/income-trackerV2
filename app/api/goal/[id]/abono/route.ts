import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const { amount } = await req.json();
  const db = getDb();

  const res = await db.execute(
    "SELECT saved, target FROM goals WHERE id=? AND user_id=?",
    [id, user.userId]
  );
  const goal = res.rows[0];
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newSaved  = Number(goal.saved) + Number(amount);
  const completed = newSaved >= Number(goal.target) ? 1 : 0;

  await db.execute(
    "UPDATE goals SET saved=?, completed=? WHERE id=? AND user_id=?",
    [newSaved, completed, id, user.userId]
  );
  return NextResponse.json({ ok: true });
}
