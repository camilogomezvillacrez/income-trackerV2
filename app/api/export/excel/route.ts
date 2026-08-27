import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { currentMonth, monthLabel } from "@/lib/utils";

const MONEY = '"$"#,##0';

function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

/** Encabezado con estilo + anchos de columna + fila congelada */
function setupSheet(
  ws: ExcelJS.Worksheet,
  columns: { header: string; key: string; width: number; money?: boolean }[]
) {
  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width,
    style: c.money ? { numFmt: MONEY } : undefined,
  }));

  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A7C59" } };
  head.alignment = { vertical: "middle" };
  head.height = 22;
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const monthParam = req.nextUrl.searchParams.get("month");
  const month = monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentMonth();

  const db = getDb();
  const uid = user.userId;

  // ── Datos ────────────────────────────────────────────────
  const [movsMes, movsAll, cats, monthly, debts, payments, fixed, goals, budgets, settings] =
    await Promise.all([
      db.execute(
        `SELECT date, 'Gasto' AS tipo, category, subcategory, note, amount, payment_method
           FROM expenses WHERE user_id=? AND substr(date,1,7)=?
         UNION ALL
         SELECT date, 'Ingreso' AS tipo, category, subcategory, note, amount, NULL
           FROM incomes  WHERE user_id=? AND substr(date,1,7)=?
         ORDER BY date DESC`,
        [uid, month, uid, month]
      ),
      db.execute(
        `SELECT date, 'Gasto' AS tipo, category, subcategory, note, amount, payment_method
           FROM expenses WHERE user_id=?
         UNION ALL
         SELECT date, 'Ingreso' AS tipo, category, subcategory, note, amount, NULL
           FROM incomes  WHERE user_id=?
         ORDER BY date DESC`,
        [uid, uid]
      ),
      db.execute(
        `SELECT category, subcategory, SUM(amount) AS total
           FROM expenses WHERE user_id=? AND substr(date,1,7)=?
          GROUP BY category, subcategory ORDER BY SUM(amount) DESC`,
        [uid, month]
      ),
      db.execute(
        `SELECT m, SUM(inc) AS ingresos, SUM(exp) AS gastos FROM (
            SELECT substr(date,1,7) AS m, amount AS inc, 0 AS exp FROM incomes  WHERE user_id=?
            UNION ALL
            SELECT substr(date,1,7) AS m, 0 AS inc, amount AS exp FROM expenses WHERE user_id=?
         ) GROUP BY m ORDER BY m DESC`,
        [uid, uid]
      ),
      db.execute(
        `SELECT * FROM debts WHERE user_id=?
          ORDER BY completed ASC, person ASC, created_at DESC`,
        [uid]
      ),
      db.execute(
        `SELECT p.*, d.person, d.type, d.description
           FROM debt_payments p JOIN debts d ON d.id = p.debt_id
          WHERE p.user_id=? ORDER BY p.date DESC`,
        [uid]
      ),
      db.execute(
        "SELECT * FROM fixed_expenses WHERE user_id=? ORDER BY active DESC, day_of_month ASC",
        [uid]
      ),
      db.execute("SELECT * FROM goals WHERE user_id=? ORDER BY completed ASC, created_at DESC", [uid]),
      db.execute("SELECT category, amount FROM budgets WHERE user_id=?", [uid]),
      db.execute("SELECT savings_target FROM users WHERE id=?", [uid]),
    ]);

  const presupuestos: Record<string, number> = {};
  for (const b of budgets.rows) presupuestos[String(b.category)] = toNum(b.amount);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Mis Finanzas";
  wb.created = new Date();

  // ── 1. Resumen del mes ───────────────────────────────────
  const ing = movsMes.rows.filter((r) => r.tipo === "Ingreso").reduce((a, r) => a + toNum(r.amount), 0);
  const gas = movsMes.rows.filter((r) => r.tipo === "Gasto").reduce((a, r) => a + toNum(r.amount), 0);
  const meta = toNum(settings.rows[0]?.savings_target ?? 20);
  const tasa = ing > 0 ? ((ing - gas) / ing) * 100 : 0;

  const ws1 = wb.addWorksheet("Resumen");
  ws1.columns = [
    { header: "Concepto", key: "k", width: 34 },
    { header: "Valor", key: "v", width: 20 },
  ];
  const h1 = ws1.getRow(1);
  h1.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  h1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4A7C59" } };
  h1.height = 22;

  const filas: [string, string | number, boolean?][] = [
    ["Mes", monthLabel(month)],
    ["Ingresos del mes", ing, true],
    ["Gastos del mes", gas, true],
    ["Balance", ing - gas, true],
    ["Tasa de ahorro", `${tasa.toFixed(1)}%`],
    ["Meta de ahorro", `${meta}%`],
    ["", ""],
    ["Total te deben", debts.rows.filter((d) => d.type === "me_deben" && !toNum(d.completed)).reduce((a, d) => a + (toNum(d.amount) - toNum(d.paid)), 0), true],
    ["Total debes", debts.rows.filter((d) => d.type === "debo" && !toNum(d.completed)).reduce((a, d) => a + (toNum(d.amount) - toNum(d.paid)), 0), true],
    ["Gastos fijos mensuales", fixed.rows.filter((f) => toNum(f.active)).reduce((a, f) => a + toNum(f.amount), 0), true],
    ["", ""],
    ["Movimientos del mes", movsMes.rows.length],
    ["Movimientos históricos", movsAll.rows.length],
    ["Generado", new Date().toLocaleString("es-CO")],
  ];

  for (const [k, v, money] of filas) {
    const row = ws1.addRow({ k, v });
    if (money) row.getCell("v").numFmt = MONEY;
    if (k === "Balance") row.font = { bold: true };
  }

  // ── 2. Movimientos del mes ───────────────────────────────
  const ws2 = wb.addWorksheet(`Movimientos ${month}`);
  setupSheet(ws2, [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Categoría", key: "cat", width: 20 },
    { header: "Subcategoría", key: "sub", width: 20 },
    { header: "Descripción", key: "note", width: 34 },
    { header: "Monto", key: "amount", width: 15, money: true },
    { header: "Método de pago", key: "pm", width: 16 },
  ]);
  for (const r of movsMes.rows) {
    ws2.addRow({
      date: String(r.date),
      tipo: String(r.tipo),
      cat: String(r.category),
      sub: r.subcategory ? String(r.subcategory) : "",
      note: r.note ? String(r.note) : "",
      amount: toNum(r.amount),
      pm: r.payment_method ? String(r.payment_method) : "",
    });
  }

  // ── 3. Histórico completo ────────────────────────────────
  const ws3 = wb.addWorksheet("Histórico");
  setupSheet(ws3, [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Mes", key: "mes", width: 10 },
    { header: "Tipo", key: "tipo", width: 10 },
    { header: "Categoría", key: "cat", width: 20 },
    { header: "Subcategoría", key: "sub", width: 20 },
    { header: "Descripción", key: "note", width: 34 },
    { header: "Monto", key: "amount", width: 15, money: true },
    { header: "Método de pago", key: "pm", width: 16 },
  ]);
  for (const r of movsAll.rows) {
    ws3.addRow({
      date: String(r.date),
      mes: String(r.date).slice(0, 7),
      tipo: String(r.tipo),
      cat: String(r.category),
      sub: r.subcategory ? String(r.subcategory) : "",
      note: r.note ? String(r.note) : "",
      amount: toNum(r.amount),
      pm: r.payment_method ? String(r.payment_method) : "",
    });
  }

  // ── 4. Por categoría (del mes) ───────────────────────────
  const ws4 = wb.addWorksheet("Por categoría");
  setupSheet(ws4, [
    { header: "Categoría", key: "cat", width: 22 },
    { header: "Subcategoría", key: "sub", width: 22 },
    { header: "Gastado", key: "total", width: 15, money: true },
    { header: "Presupuesto", key: "pres", width: 15, money: true },
    { header: "% del gasto total", key: "pct", width: 17 },
  ]);
  for (const r of cats.rows) {
    const total = toNum(r.total);
    ws4.addRow({
      cat: String(r.category),
      sub: r.subcategory ? String(r.subcategory) : "",
      total,
      pres: presupuestos[String(r.category)] ?? "",
      pct: gas > 0 ? `${((total / gas) * 100).toFixed(1)}%` : "0%",
    });
  }

  // ── 5. Resumen por mes ───────────────────────────────────
  const ws5 = wb.addWorksheet("Resumen por mes");
  setupSheet(ws5, [
    { header: "Mes", key: "mes", width: 12 },
    { header: "Ingresos", key: "ing", width: 15, money: true },
    { header: "Gastos", key: "gas", width: 15, money: true },
    { header: "Balance", key: "bal", width: 15, money: true },
    { header: "Tasa de ahorro", key: "tasa", width: 15 },
  ]);
  for (const r of monthly.rows) {
    const i = toNum(r.ingresos);
    const g = toNum(r.gastos);
    ws5.addRow({
      mes: String(r.m),
      ing: i,
      gas: g,
      bal: i - g,
      tasa: i > 0 ? `${(((i - g) / i) * 100).toFixed(1)}%` : "—",
    });
  }

  // ── 6. Deudas ────────────────────────────────────────────
  const ws6 = wb.addWorksheet("Deudas");
  setupSheet(ws6, [
    { header: "Persona", key: "person", width: 20 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Descripción", key: "desc", width: 30 },
    { header: "Monto total", key: "amount", width: 15, money: true },
    { header: "Abonado", key: "paid", width: 15, money: true },
    { header: "Falta", key: "pending", width: 15, money: true },
    { header: "Fecha", key: "date", width: 12 },
    { header: "Vence", key: "due", width: 12 },
    { header: "Estado", key: "estado", width: 14 },
  ]);
  for (const d of debts.rows) {
    ws6.addRow({
      person: String(d.person),
      tipo: String(d.type) === "debo" ? "Yo debo" : "Me deben",
      desc: d.description ? String(d.description) : "",
      amount: toNum(d.amount),
      paid: toNum(d.paid),
      pending: Math.max(toNum(d.amount) - toNum(d.paid), 0),
      date: String(d.date),
      due: d.due_date ? String(d.due_date) : "",
      estado: toNum(d.completed) ? "Saldada" : "Pendiente",
    });
  }

  // ── 7. Abonos a deudas ───────────────────────────────────
  const ws7 = wb.addWorksheet("Abonos");
  setupSheet(ws7, [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Persona", key: "person", width: 20 },
    { header: "Tipo", key: "tipo", width: 14 },
    { header: "Deuda", key: "desc", width: 30 },
    { header: "Abono", key: "amount", width: 15, money: true },
    { header: "Nota", key: "note", width: 26 },
  ]);
  for (const p of payments.rows) {
    ws7.addRow({
      date: String(p.date),
      person: String(p.person),
      tipo: String(p.type) === "debo" ? "Yo debo" : "Me deben",
      desc: p.description ? String(p.description) : "",
      amount: toNum(p.amount),
      note: p.note ? String(p.note) : "",
    });
  }

  // ── 8. Gastos fijos ──────────────────────────────────────
  const ws8 = wb.addWorksheet("Gastos fijos");
  setupSheet(ws8, [
    { header: "Nombre", key: "name", width: 24 },
    { header: "Monto", key: "amount", width: 15, money: true },
    { header: "Día del mes", key: "day", width: 12 },
    { header: "Categoría", key: "cat", width: 20 },
    { header: "Subcategoría", key: "sub", width: 20 },
    { header: "Método de pago", key: "pm", width: 16 },
    { header: "Estado", key: "estado", width: 12 },
  ]);
  for (const f of fixed.rows) {
    ws8.addRow({
      name: String(f.name),
      amount: toNum(f.amount),
      day: toNum(f.day_of_month),
      cat: String(f.category),
      sub: f.subcategory ? String(f.subcategory) : "",
      pm: f.payment_method ? String(f.payment_method) : "",
      estado: toNum(f.active) ? "Activo" : "Pausado",
    });
  }

  // ── 9. Metas ─────────────────────────────────────────────
  const ws9 = wb.addWorksheet("Metas");
  setupSheet(ws9, [
    { header: "Meta", key: "name", width: 26 },
    { header: "Objetivo", key: "target", width: 15, money: true },
    { header: "Ahorrado", key: "saved", width: 15, money: true },
    { header: "Falta", key: "falta", width: 15, money: true },
    { header: "Avance", key: "pct", width: 12 },
    { header: "Estado", key: "estado", width: 14 },
  ]);
  for (const g of goals.rows) {
    const target = toNum(g.target);
    const saved = toNum(g.saved);
    ws9.addRow({
      name: `${g.emoji ?? "🎯"} ${String(g.name)}`,
      target,
      saved,
      falta: Math.max(target - saved, 0),
      pct: target > 0 ? `${Math.round((saved / target) * 100)}%` : "0%",
      estado: toNum(g.completed) ? "Cumplida" : "En progreso",
    });
  }

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(new Uint8Array(buffer as ArrayBuffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="mis-finanzas-${month}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
