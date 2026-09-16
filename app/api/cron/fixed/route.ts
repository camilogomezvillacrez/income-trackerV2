import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { fmt, todayBogota, dueDayIn } from "@/lib/utils";

/**
 * Registra los gastos fijos que ya vencieron y avisa al telefono.
 *
 * Lo dispara el cron diario de Vercel (ver vercel.json). Se puede repetir sin
 * miedo: solo toca los fijos que aun no tienen gasto en el mes, asi que
 * ejecutarlo dos veces no duplica nada.
 *
 * Coge los vencidos y no solo los de hoy a proposito: si un dia falla el cron,
 * al siguiente se pone al dia en vez de saltarse el mes.
 */
export async function GET(req: NextRequest) {
  /*
   * Cierra por defecto: sin secreto no se ejecuta. Esta ruta escribe gastos de
   * todos los usuarios, asi que dejarla abierta cuando falta la variable seria
   * la peor forma de fallar. Vercel manda la cabecera solo, siempre que
   * CRON_SECRET este definido en el proyecto.
   */
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Falta CRON_SECRET" }, { status: 500 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hoy = todayBogota();            // YYYY-MM-DD en Colombia
  const month = hoy.slice(0, 7);
  const diaHoy = Number(hoy.slice(8, 10));

  const db = getDb();
  const now = new Date().toISOString();

  // Activos que aun no tienen gasto registrado en este mes.
  const pendientes = await db.execute({
    sql: `SELECT f.* FROM fixed_expenses f
          WHERE f.active = 1
            AND NOT EXISTS (
              SELECT 1 FROM expenses e
              WHERE e.fixed_expense_id = f.id
                AND e.user_id = f.user_id
                AND substr(e.date,1,7) = ?
            )
          ORDER BY f.user_id, f.day_of_month`,
    args: [month],
  });

  // Agrupados por usuario: una notificacion por persona, no una por gasto.
  const porUsuario = new Map<number, { nombre: string; monto: number }[]>();

  for (const f of pendientes.rows) {
    const dia = dueDayIn(month, Number(f.day_of_month));
    if (dia > diaHoy) continue;                  // todavia no le toca

    const userId = Number(f.user_id);
    const amount = Number(f.amount);
    const date = `${month}-${String(dia).padStart(2, "0")}`;

    await db.execute(
      `INSERT INTO expenses
         (amount, category, subcategory, note, date, created_at, payment_method, user_id, fixed_expense_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        amount,
        String(f.category),
        f.subcategory ? String(f.subcategory) : null,
        String(f.name),
        date,
        now,
        f.payment_method ? String(f.payment_method) : "Efectivo",
        userId,
        Number(f.id),
      ]
    );

    const lista = porUsuario.get(userId) ?? [];
    lista.push({ nombre: String(f.name), monto: amount });
    porUsuario.set(userId, lista);
  }

  let avisados = 0;
  for (const [userId, items] of porUsuario) {
    const total = items.reduce((a, i) => a + i.monto, 0);
    const nombres = items.map((i) => i.nombre).join(", ");

    avisados += await sendPushToUser(userId, {
      title: items.length === 1 ? "Gasto fijo registrado" : `${items.length} gastos fijos registrados`,
      // El monto va en el aviso para poder corregirlo sin abrir la app a ciegas
      body: `${nombres} · ${fmt(total)}`,
      url: "/",
      // Mismo tag cada dia: si no abres la de ayer, no se te apilan
      tag: "fijos",
    });
  }

  const registrados = [...porUsuario.values()].reduce((a, l) => a + l.length, 0);
  return NextResponse.json({ ok: true, fecha: hoy, registrados, avisados });
}
