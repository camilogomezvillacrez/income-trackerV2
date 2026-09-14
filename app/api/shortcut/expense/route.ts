import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { hashShortcutToken } from "@/lib/shortcutToken";
import { categorizeByRules, parseAmount, todayBogota } from "@/lib/shortcutParse";
import { EXP_CATS, SUBCATS } from "@/constants/categories";

/*
 * Endpoint del atajo de Apple Wallet. Ruta pública: se autentica con el
 * token del usuario en "Authorization: Bearer ..." (no hay cookie en Atajos).
 * Cuerpo: { amount: "$45.900,00", merchant: "Éxito", card: "Visa" }
 */

const fmt = (n: number) => `$${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;

/** Comercio desconocido para las reglas: Claude elige entre las categorías de la app. */
async function categorizeWithAI(merchant: string) {
  if (!process.env.ANTHROPIC_API_KEY || !merchant) return null;
  try {
    const client = new Anthropic({ timeout: 6000, maxRetries: 0 });
    const options = EXP_CATS.map((c) => `${c}: ${(SUBCATS[c] ?? []).join(", ")}`).join("\n");
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 60,
      messages: [{
        role: "user",
        content:
          `Clasifica un pago con tarjeta en Colombia al comercio "${merchant}".\n` +
          `Categorías y subcategorías:\n${options}\n\n` +
          `Responde solo JSON: {"category":"...","subcategory":"..."}. ` +
          `Si no estás seguro usa {"category":"General","subcategory":null}.`,
      }],
    });
    const text = msg.content.find((b) => b.type === "text")?.text ?? "";
    const parsed = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const category = String(parsed.category);
    if (!(EXP_CATS as readonly string[]).includes(category)) return null;
    const subcategory = SUBCATS[category]?.includes(parsed.subcategory) ? String(parsed.subcategory) : null;
    return { category, subcategory };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Falta el token" }, { status: 401 });
  }

  const db = getDb();
  const userRes = await db.execute(
    "SELECT id FROM users WHERE shortcut_token_hash=?",
    [hashShortcutToken(token)]
  );
  const userId = userRes.rows[0]?.id;
  if (userId == null) {
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const amount = parseAmount(body.amount);
  if (!amount) {
    return NextResponse.json({ error: `Monto no válido: ${body.amount ?? "vacío"}` }, { status: 400 });
  }

  const merchant = String(body.merchant ?? "").trim().slice(0, 120);
  const card     = String(body.card ?? "").trim().slice(0, 60);

  const cat = categorizeByRules(merchant)
    ?? await categorizeWithAI(merchant)
    ?? { category: "General", subcategory: null };

  await db.execute(
    `INSERT INTO expenses (amount, category, subcategory, note, date, created_at, payment_method, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      amount, cat.category, cat.subcategory, merchant || "Apple Pay",
      todayBogota(), new Date().toISOString(), card || "Apple Pay", Number(userId),
    ]
  );

  const where = cat.subcategory ? `${cat.category} › ${cat.subcategory}` : cat.category;
  return NextResponse.json({
    ok: true,
    message: `✓ ${fmt(amount)} en ${merchant || "Apple Pay"} · ${where}`,
  });
}
