import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const { name, target, saved = 0, emoji = "🎯" } = await req.json();
  const db = getDb();
  await db.execute(
    `INSERT INTO goals (name, target, saved, emoji, created_at, completed, user_id)
     VALUES (?, ?, ?, ?, ?, 0, ?)`,
    [name, target, saved, emoji, new Date().toISOString(), user.userId]
  );
  return NextResponse.json({ ok: true });
}
