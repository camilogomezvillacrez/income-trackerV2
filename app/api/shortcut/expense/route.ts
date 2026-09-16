import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getDb } from "@/lib/db";
import { hashShortcutToken } from "@/lib/shortcutToken";
import { checkLimit, clientIp, SHORTCUT_LIMIT, SHORTCUT_IP_LIMIT } from "@/lib/rateLimit";
import { sendPushToUser } from "@/lib/push";
import { categorizeByRules, parseAmount, todayBogota } from "@/lib/shortcutParse";
import { getCategories } from "@/lib/categories";
import { getPaymentMethods, matchPaymentMethod } from "@/lib/paymentMethods";
import type { Category } from "@/types";
import { groupCategories } from "@/lib/categoryMeta";

/*
 * Endpoint del atajo de Apple Wallet. Ruta pública: se autentica con el
 * token del usuario en "Authorization: Bearer ..." (no hay cookie en Atajos).
 * Cuerpo: { amount: "$45.900,00", merchant: "Éxito", card: "Visa" }
 */

const fmt = (n: number) => `$ ${n.toLocaleString("es-CO", { maximumFractionDigits: 2 })}`;

type Pick = { category: string; subcategory: string | null };

/** Comercio desconocido para las reglas: Claude elige entre las categorías del usuario. */
async function categorizeWithAI(merchant: string, categories: Category[]): Promise<Pick | null> {
  if (!process.env.ANTHROPIC_API_KEY || !merchant || categories.length === 0) return null;
  try {
    const client = new Anthropic({ timeout: 6000, maxRetries: 0 });
    const options = groupCategories(categories)
      .map((g) => {
        const cats = g.categories.map((c) => `  ${c.name}: ${c.subs.map((s) => s.name).join(", ")}`).join("\n");
        return g.name ? `${g.name}\n${cats}` : cats;
      })
      .join("\n");
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
    const cat = categories.find((c) => c.name === String(parsed.category));
    if (!cat) return null;
    const subcategory = cat.subs.some((s) => s.name === parsed.subcategory) ? String(parsed.subcategory) : null;
    return { category: cat.name, subcategory };
  } catch {
    return null;
  }
}

/** Las reglas conocen los nombres por defecto: solo sirven si el usuario conserva esa categoría. */
function ruleForUser(merchant: string, categories: Category[]): Pick | null {
  const rule = categorizeByRules(merchant);
  const cat = rule && categories.find((c) => c.name === rule.category);
  if (!rule || !cat) return null;
  return { category: cat.name, subcategory: cat.subs.some((s) => s.name === rule.subcategory) ? rule.subcategory : null };
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "Falta el token" }, { status: 401 });
  }

  // Primero por IP: así un token inventado se corta sin gastar una lectura de Turso.
  const ipLimit = checkLimit(SHORTCUT_IP_LIMIT, clientIp(req));
  if (!ipLimit.allowed) {
    const mins = Math.ceil((ipLimit.retryAfterMs ?? 0) / 60000);
    return NextResponse.json(
      { error: `Demasiadas peticiones. Intenta en ${mins} minutos.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil((ipLimit.retryAfterMs ?? 0) / 1000)) } }
    );
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

  // Los comercios desconocidos se clasifican con Claude, que gasta saldo:
  // se topa por usuario para que un atajo en bucle no se lo coma.
  const limit = checkLimit(SHORTCUT_LIMIT, String(userId));
  if (!limit.allowed) {
    const mins = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return NextResponse.json(
      { error: `Demasiados gastos seguidos. Intenta en ${mins} minutos.` },
      { status: 429, headers: { "Retry-After": String(Math.ceil((limit.retryAfterMs ?? 0) / 1000)) } }
    );
  }

  const body = await req.json().catch(() => ({}));
  const amount = parseAmount(body.amount);
  if (!amount) {
    return NextResponse.json({ error: `Monto no válido: ${body.amount ?? "vacío"}` }, { status: 400 });
  }

  const merchant = String(body.merchant ?? "").trim().slice(0, 120);
  const card     = String(body.card ?? "").trim().slice(0, 60);

  const expenseCats = (await getCategories(Number(userId))).filter((c) => c.tipo === "gasto");
  // La tarjeta del pase se guarda con el nombre que el usuario le puso en Configuración
  const paymentMethod = matchPaymentMethod(card, await getPaymentMethods(Number(userId))) ?? "Apple Pay";
  const cat = ruleForUser(merchant, expenseCats)
    ?? await categorizeWithAI(merchant, expenseCats)
    ?? { category: "General", subcategory: null };

  await db.execute(
    `INSERT INTO expenses (amount, category, subcategory, note, date, created_at, payment_method, user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      amount, cat.category, cat.subcategory, merchant || "Apple Pay",
      todayBogota(), new Date().toISOString(), paymentMethod, Number(userId),
    ]
  );

  const where = cat.subcategory ? `${cat.category} › ${cat.subcategory}` : cat.category;

  // Push con el ícono de la app. Se espera antes de responder: en Vercel la
  // función se congela al devolver la respuesta y el envío quedaría a medias.
  await sendPushToUser(Number(userId), {
    title: `Gasto registrado · ${fmt(amount)}`,
    // Se nombra el medio: si sale el nombre crudo del pase es que los últimos
    // 4 dígitos configurados no son los que manda Apple Pay.
    body: `${merchant || "Apple Pay"} · ${paymentMethod} → ${where}`,
    url: "/",
  });

  return NextResponse.json({
    ok: true,
    message: `✓ ${fmt(amount)} en ${merchant || "Apple Pay"} · ${paymentMethod} · ${where}`,
  });
}
