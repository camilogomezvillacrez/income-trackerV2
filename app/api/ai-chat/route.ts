import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";
import { fmt, currentMonth, monthLabel } from "@/lib/utils";

const client = new Anthropic();

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 20;
const MAX_MSG_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const month: string =
    typeof body.month === "string" && /^\d{4}-\d{2}$/.test(body.month)
      ? body.month
      : currentMonth();

  const history: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
        .filter(
          (m: ChatMessage) =>
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.trim().length > 0
        )
        .slice(-MAX_HISTORY)
        .map((m: ChatMessage) => ({
          role: m.role,
          content: m.content.slice(0, MAX_MSG_LENGTH),
        }))
    : [];

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const data = await getDashboardData(month, user.userId);

  const catLines = data.by_category
    .map((c) => {
      const subs = c.subs.map((s) => `${s.name} ${fmt(s.total)}`).join(", ");
      const budget = data.budgets[c.category];
      const budgetTxt = budget
        ? ` (presupuesto ${fmt(budget)}, ${c.total > budget ? "EXCEDIDO" : "dentro del límite"})`
        : "";
      return `- ${c.category}: ${fmt(c.total)}${budgetTxt}${subs ? ` [${subs}]` : ""}`;
    })
    .join("\n");

  const goalLines = data.goals
    .map(
      (g) =>
        `- ${g.emoji} ${g.name}: ahorrado ${fmt(g.saved)} de ${fmt(g.target)} (${g.pct}%), falta ${fmt(g.falta)}` +
        (g.meses_restantes ? `, ~${g.meses_restantes} meses al ritmo actual` : "")
    )
    .join("\n");

  const movLines = data.all_movs
    .slice(0, 40)
    .map(
      (m) =>
        `- ${m.date} | ${m.tipo} | ${m.category}${m.subcategory ? "/" + m.subcategory : ""} | ${fmt(m.amount)}${m.note ? ` | ${m.note}` : ""}`
    )
    .join("\n");

  const historyLines = data.monthly
    .map((r) => `- ${r.month}: ingresos ${fmt(r.ingresos)}, gastos ${fmt(r.gastos)}`)
    .join("\n");

  const system = `Eres el asistente financiero personal de esta app de finanzas y le hablas al usuario como un parcero de confianza: cercano, relajado y directo, en español colombiano. El usuario no es experto en finanzas ni en tecnología.

Datos reales del usuario para el mes de ${monthLabel(data.current_month)}:
- Ingresos del mes: ${fmt(data.month_inc)}
- Gastos del mes: ${fmt(data.month_exp)}
- Balance: ${fmt(data.balance)}
- Tasa de ahorro: ${data.tasa_ahorro.toFixed(1)}% (su objetivo es ${data.savings_target}%)

Gastos por categoría:
${catLines || "Sin gastos registrados este mes."}

Metas de ahorro:
${goalLines || "Sin metas registradas."}

Historial de meses recientes:
${historyLines || "Sin historial."}

Movimientos del mes (los más recientes):
${movLines || "Sin movimientos."}

Reglas:
- Basa tus respuestas en estos datos reales; cita cifras concretas con su formato ($X.XXX).
- Respuestas cortas: 2-5 oraciones para preguntas simples. Usa listas solo si aportan claridad.
- Si preguntan por un mes distinto al mostrado, aclara que solo ves los datos del mes actual seleccionado y sugiere cambiar de mes en la app.
- No inventes datos que no estén aquí. Si falta información, dilo.
- No des consejos de inversión específicos (acciones, cripto); limítate a hábitos de gasto, ahorro y presupuesto.
- Puedes resaltar cifras o ideas clave con **negrita**. No uses ningún otro formato markdown (nada de #, tablas, ni listas numeradas complejas).

Tono (importante):
- Trátalo con confianza usando muletillas colombianas: "mano", "bro", "mani", "broki", "parce". Mete una o dos por respuesta, donde caigan naturales (al saludar o al rematar una idea), variándolas; no en cada frase, que suena forzado.
- Habla claro y sin rodeos, como un amigo que sabe de plata: si los números están mal, se lo dices de frente; si van bien, lo celebras.
- Nada de groserías ni de tratarlo mal. Confianza sí, falta de respeto no.`;

  try {
    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system,
      messages: history,
    });

    const reply =
      message.content.find((b) => b.type === "text")?.text ??
      "No pude generar una respuesta, intenta de nuevo.";

    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json(
      { reply: "El asistente no está disponible en este momento. Intenta de nuevo en unos minutos." },
      { status: 200 }
    );
  }
}
