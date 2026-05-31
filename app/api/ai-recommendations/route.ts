import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { fmt } from "@/lib/utils";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const data = await req.json();
  const { month_inc, month_exp, balance, tasa_ahorro, by_category, goals } = data;

  const catSummary = (by_category as { category: string; total: number }[])
    .slice(0, 6)
    .map((c) => `${c.category}: ${fmt(c.total)}`)
    .join(", ");

  const goalsSummary = (goals as { emoji: string; name: string; pct: number }[])
    .map((g) => `${g.emoji} ${g.name} (${g.pct}%)`)
    .join(", ");

  const prompt = `Eres un asesor financiero personal amigable. Analiza estos datos financieros del mes y da exactamente 4 recomendaciones cortas, prácticas y específicas en español. Cada una en 1-2 oraciones máximo.

Datos del mes:
- Ingresos: ${fmt(month_inc)}
- Gastos: ${fmt(month_exp)}
- Balance: ${fmt(balance)}
- Tasa de ahorro: ${tasa_ahorro.toFixed(1)}%
- Gastos por categoría: ${catSummary || "Sin datos"}
- Metas de ahorro: ${goalsSummary || "Sin metas"}

Responde con un array JSON con exactamente 4 strings. Solo el JSON, sin explicación adicional.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    const match = text.match(/\[[\s\S]*\]/);
    const recommendations: string[] = match ? JSON.parse(match[0]) : [];

    return NextResponse.json({ recommendations: recommendations.slice(0, 4) });
  } catch {
    return NextResponse.json({
      recommendations: [
        "No se pudo cargar el análisis IA en este momento.",
      ],
    });
  }
}
