import { getDb } from "./db";
import type { DashboardData, Movement, Goal, Debt, DebtPayment, FixedExpense, CategoryTotal, MonthlyRow } from "@/types";

function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

/** "2026-09" → ["2026-09-01", "2026-10-01"]: rango [inicio, fin) que sí usa el índice (user_id, date). */
function monthRange(month: string): [string, string] {
  const [y, m] = month.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  return [`${month}-01`, `${next}-01`];
}

export async function getDashboardData(month: string, userId: number): Promise<DashboardData> {
  const db = getDb();
  const [from, to] = monthRange(month);

  // Todas las consultas viajan juntas a Turso en un solo round-trip.
  const [
    allMonthsRes, monthlyRes, incRes, expRes, catRes, incCatRes, movsRes,
    weeklyRes, goalsRes, avgSavingsRes, debtsRes, paymentsRes, fixedRes,
    budgetsRes, userRes,
  ] = await db.batch([
    // ── All months with data for this user ──────────────────────
    {
      sql: `SELECT DISTINCT substr(date,1,7) as m FROM (
              SELECT date FROM incomes WHERE user_id=?
              UNION ALL
              SELECT date FROM expenses WHERE user_id=?
            ) ORDER BY m DESC`,
      args: [userId, userId],
    },
    // ── Monthly totals (last 6 months) ──────────────────────────
    {
      sql: `SELECT m, SUM(inc) as ingresos, SUM(exp) as gastos FROM (
              SELECT substr(date,1,7) as m, amount as inc, 0 as exp FROM incomes WHERE user_id=?
              UNION ALL
              SELECT substr(date,1,7) as m, 0 as inc, amount as exp FROM expenses WHERE user_id=?
            )
            GROUP BY m ORDER BY m DESC LIMIT 6`,
      args: [userId, userId],
    },
    // ── KPIs ─────────────────────────────────────────────────────
    {
      sql: "SELECT COALESCE(SUM(amount),0) as t FROM incomes WHERE user_id=? AND date>=? AND date<?",
      args: [userId, from, to],
    },
    {
      sql: "SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE user_id=? AND date>=? AND date<?",
      args: [userId, from, to],
    },
    // ── Expenses by category + subcategory ──────────────────────
    {
      sql: `SELECT category, subcategory, SUM(amount) as total
            FROM expenses WHERE user_id=? AND date>=? AND date<?
            GROUP BY category, subcategory ORDER BY SUM(amount) DESC`,
      args: [userId, from, to],
    },
    // ── Income by category ──────────────────────────────────────
    {
      sql: `SELECT category, SUM(amount) as t FROM incomes
            WHERE user_id=? AND date>=? AND date<? GROUP BY category ORDER BY t DESC`,
      args: [userId, from, to],
    },
    // ── All movements this month ─────────────────────────────────
    {
      sql: `SELECT id, amount, category, subcategory, note, date, payment_method, 'gasto' as tipo
            FROM expenses WHERE user_id=? AND date>=? AND date<?
            UNION ALL
            SELECT id, amount, category, subcategory, note, date, NULL as payment_method, 'ingreso' as tipo
            FROM incomes WHERE user_id=? AND date>=? AND date<?
            ORDER BY date DESC, id DESC LIMIT 200`,
      args: [userId, from, to, userId, from, to],
    },
    // ── Weekly spending ──────────────────────────────────────────
    {
      sql: `SELECT strftime('%w', date) as dow, SUM(amount) as total
            FROM expenses WHERE user_id=? AND date>=? AND date<? GROUP BY dow`,
      args: [userId, from, to],
    },
    // ── Goals ────────────────────────────────────────────────────
    {
      sql: "SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC",
      args: [userId],
    },
    {
      sql: `SELECT AVG(bal) as avg FROM (
              SELECT substr(date,1,7) as m,
                SUM(CASE WHEN t='i' THEN amount ELSE -amount END) as bal
              FROM (
                SELECT date, amount, 'i' as t FROM incomes WHERE user_id=?
                UNION ALL
                SELECT date, amount, 'g' as t FROM expenses WHERE user_id=?
              )
              GROUP BY m ORDER BY m DESC LIMIT 3
            )`,
      args: [userId, userId],
    },
    // ── Deudas ───────────────────────────────────────────────────
    {
      sql: `SELECT * FROM debts WHERE user_id=?
            ORDER BY completed ASC, due_date IS NULL ASC, due_date ASC, created_at DESC`,
      args: [userId],
    },
    {
      sql: "SELECT * FROM debt_payments WHERE user_id=? ORDER BY date DESC, id DESC",
      args: [userId],
    },
    // ── Gastos fijos ─────────────────────────────────────────────
    {
      sql: `SELECT f.*,
              (SELECT COUNT(*) FROM expenses e
               WHERE e.fixed_expense_id = f.id
                 AND e.user_id = f.user_id
                 AND e.date >= ? AND e.date < ?) AS reg
            FROM fixed_expenses f
            WHERE f.user_id = ?
            ORDER BY f.active DESC, f.day_of_month ASC, f.name ASC`,
      args: [from, to, userId],
    },
    // ── Budgets ──────────────────────────────────────────────────
    {
      sql: "SELECT category, amount FROM budgets WHERE user_id=?",
      args: [userId],
    },
    // ── Savings target ───────────────────────────────────────────
    {
      sql: "SELECT savings_target FROM users WHERE id=?",
      args: [userId],
    },
  ], "read");

  const all_months: string[] = allMonthsRes.rows.map((r) => String(r.m));

  // Siempre incluir el mes calendario actual aunque no tenga transacciones
  const calendarMonth = new Date().toISOString().slice(0, 7);
  if (!all_months.includes(calendarMonth)) all_months.unshift(calendarMonth);

  // Siempre usar el mes pedido — nunca hacer fallback a otro mes
  const current_month = month;

  // Se piden los 6 más recientes (DESC) y se devuelven en orden cronológico
  const monthly: MonthlyRow[] = monthlyRes.rows.map((r) => ({
    month: String(r.m),
    ingresos: toNum(r.ingresos),
    gastos: toNum(r.gastos),
  })).reverse();

  const month_inc    = toNum(incRes.rows[0]?.t);
  const month_exp    = toNum(expRes.rows[0]?.t);
  const balance      = month_inc - month_exp;
  const tasa_ahorro  = month_inc > 0 ? (balance / month_inc) * 100 : 0;

  const catMap = new Map<string, CategoryTotal>();
  for (const r of catRes.rows) {
    const cat = String(r.category);
    const sub = r.subcategory ? String(r.subcategory) : null;
    const tot = toNum(r.total);
    if (!catMap.has(cat)) catMap.set(cat, { category: cat, total: 0, subs: [] });
    const entry = catMap.get(cat)!;
    entry.total += tot;
    if (sub) entry.subs.push({ name: sub, total: tot });
  }
  const by_category: CategoryTotal[] = Array.from(catMap.values()).sort((a, b) => b.total - a.total);

  const by_cat_inc = incCatRes.rows.map((r) => ({ category: String(r.category), t: toNum(r.t) }));

  const all_movs: Movement[] = movsRes.rows.map((r) => ({
    id: toNum(r.id),
    tipo: String(r.tipo) as "ingreso" | "gasto",
    amount: toNum(r.amount),
    category: String(r.category),
    subcategory: r.subcategory ? String(r.subcategory) : null,
    note: String(r.note ?? ""),
    date: String(r.date),
    payment_method: r.payment_method ? String(r.payment_method) : null,
  }));
  const recent = all_movs.slice(0, 6);

  const weekly: Record<string, number> = { "0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0 };
  for (const r of weeklyRes.rows) weekly[String(r.dow)] = toNum(r.total);

  const avgSavings = toNum(avgSavingsRes.rows[0]?.avg);

  const goals: Goal[] = goalsRes.rows.map((r) => {
    const target = toNum(r.target);
    const saved  = toNum(r.saved);
    const pct    = target > 0 ? Math.round((saved / target) * 100) : 0;
    const falta  = Math.max(target - saved, 0);
    return {
      id: toNum(r.id),
      name: String(r.name),
      target, saved, pct, falta,
      emoji: String(r.emoji ?? "🎯"),
      completed: toNum(r.completed),
      meses_restantes: avgSavings > 0 && falta > 0 ? Math.ceil(falta / avgSavings) : null,
    };
  });

  const paymentsByDebt = new Map<number, DebtPayment[]>();
  for (const r of paymentsRes.rows) {
    const did = toNum(r.debt_id);
    if (!paymentsByDebt.has(did)) paymentsByDebt.set(did, []);
    paymentsByDebt.get(did)!.push({
      id: toNum(r.id),
      amount: toNum(r.amount),
      date: String(r.date),
      note: r.note ? String(r.note) : null,
    });
  }

  const todayMs = Date.parse(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const debts: Debt[] = debtsRes.rows.map((r) => {
    const amount  = toNum(r.amount);
    const paid    = toNum(r.paid);
    const pending = Math.max(amount - paid, 0);
    const due     = r.due_date ? String(r.due_date) : null;
    return {
      id: toNum(r.id),
      person: String(r.person),
      type: String(r.type) === "me_deben" ? "me_deben" : "debo",
      amount,
      paid,
      pending,
      pct: amount > 0 ? Math.min(Math.round((paid / amount) * 100), 100) : 0,
      description: r.description ? String(r.description) : null,
      date: String(r.date),
      due_date: due,
      completed: toNum(r.completed),
      days_left: due
        ? Math.round((Date.parse(due + "T00:00:00Z") - todayMs) / 86400000)
        : null,
      payments: paymentsByDebt.get(toNum(r.id)) ?? [],
    };
  });

  const fixed_expenses: FixedExpense[] = fixedRes.rows.map((r) => ({
    id: toNum(r.id),
    name: String(r.name),
    amount: toNum(r.amount),
    category: String(r.category),
    subcategory: r.subcategory ? String(r.subcategory) : null,
    day_of_month: toNum(r.day_of_month),
    payment_method: r.payment_method ? String(r.payment_method) : null,
    active: toNum(r.active),
    registered: toNum(r.reg) > 0,
  }));

  const budgets: Record<string, number> = {};
  for (const r of budgetsRes.rows) budgets[String(r.category)] = toNum(r.amount);

  const savings_target = toNum(userRes.rows[0]?.savings_target ?? 20);

  return {
    monthly, by_category, by_cat_inc, recent, all_movs,
    month_inc, month_exp, balance, tasa_ahorro, savings_target,
    current_month, goals, debts, fixed_expenses, all_months, budgets, weekly,
  };
}
