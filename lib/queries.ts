import { getDb } from "./db";
import type { DashboardData, Movement, Goal, Debt, DebtPayment, CategoryTotal, MonthlyRow } from "@/types";

function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

export async function getDashboardData(month: string, userId: number): Promise<DashboardData> {
  const db = getDb();

  // ── All months with data for this user ──────────────────────
  const allMonthsRes = await db.execute(`
    SELECT DISTINCT substr(date,1,7) as m FROM (
      SELECT date FROM incomes WHERE user_id=?
      UNION ALL
      SELECT date FROM expenses WHERE user_id=?
    ) ORDER BY m DESC
  `, [userId, userId]);
  const all_months: string[] = allMonthsRes.rows.map((r) => String(r.m));

  // Siempre incluir el mes calendario actual aunque no tenga transacciones
  const calendarMonth = new Date().toISOString().slice(0, 7);
  if (!all_months.includes(calendarMonth)) all_months.unshift(calendarMonth);

  // Siempre usar el mes pedido — nunca hacer fallback a otro mes
  const current_month = month;

  // ── Monthly totals (last 6 months) ──────────────────────────
  const monthlyRes = await db.execute(`
    SELECT m, SUM(inc) as ingresos, SUM(exp) as gastos FROM (
      SELECT substr(date,1,7) as m, amount as inc, 0 as exp FROM incomes WHERE user_id=?
      UNION ALL
      SELECT substr(date,1,7) as m, 0 as inc, amount as exp FROM expenses WHERE user_id=?
    )
    GROUP BY m ORDER BY m ASC LIMIT 6
  `, [userId, userId]);
  const monthly: MonthlyRow[] = monthlyRes.rows.map((r) => ({
    month: String(r.m),
    ingresos: toNum(r.ingresos),
    gastos: toNum(r.gastos),
  }));

  // ── KPIs ─────────────────────────────────────────────────────
  const incRes = await db.execute(
    "SELECT COALESCE(SUM(amount),0) as t FROM incomes WHERE substr(date,1,7)=? AND user_id=?",
    [current_month, userId]
  );
  const expRes = await db.execute(
    "SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE substr(date,1,7)=? AND user_id=?",
    [current_month, userId]
  );
  const month_inc    = toNum(incRes.rows[0]?.t);
  const month_exp    = toNum(expRes.rows[0]?.t);
  const balance      = month_inc - month_exp;
  const tasa_ahorro  = month_inc > 0 ? (balance / month_inc) * 100 : 0;

  // ── Expenses by category + subcategory ──────────────────────
  const catRes = await db.execute(
    `SELECT category, subcategory, SUM(amount) as total
     FROM expenses WHERE substr(date,1,7)=? AND user_id=?
     GROUP BY category, subcategory ORDER BY SUM(amount) DESC`,
    [current_month, userId]
  );
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

  // ── Income by category ──────────────────────────────────────
  const incCatRes = await db.execute(
    `SELECT category, SUM(amount) as t FROM incomes
     WHERE substr(date,1,7)=? AND user_id=? GROUP BY category ORDER BY t DESC`,
    [current_month, userId]
  );
  const by_cat_inc = incCatRes.rows.map((r) => ({ category: String(r.category), t: toNum(r.t) }));

  // ── All movements this month ─────────────────────────────────
  const movsRes = await db.execute(
    `SELECT id, amount, category, subcategory, note, date, payment_method, 'gasto' as tipo
     FROM expenses WHERE substr(date,1,7)=? AND user_id=?
     UNION ALL
     SELECT id, amount, category, subcategory, note, date, NULL as payment_method, 'ingreso' as tipo
     FROM incomes WHERE substr(date,1,7)=? AND user_id=?
     ORDER BY date DESC, id DESC LIMIT 200`,
    [current_month, userId, current_month, userId]
  );
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

  // ── Weekly spending ──────────────────────────────────────────
  const weeklyRes = await db.execute(
    `SELECT strftime('%w', date) as dow, SUM(amount) as total
     FROM expenses WHERE substr(date,1,7)=? AND user_id=? GROUP BY dow`,
    [current_month, userId]
  );
  const weekly: Record<string, number> = { "0":0,"1":0,"2":0,"3":0,"4":0,"5":0,"6":0 };
  for (const r of weeklyRes.rows) weekly[String(r.dow)] = toNum(r.total);

  // ── Goals ────────────────────────────────────────────────────
  const goalsRes = await db.execute(
    "SELECT * FROM goals WHERE user_id=? ORDER BY created_at DESC",
    [userId]
  );
  const avgSavingsRes = await db.execute(
    `SELECT AVG(bal) as avg FROM (
       SELECT substr(date,1,7) as m,
         SUM(CASE WHEN t='i' THEN amount ELSE -amount END) as bal
       FROM (
         SELECT date, amount, 'i' as t FROM incomes WHERE user_id=?
         UNION ALL
         SELECT date, amount, 'g' as t FROM expenses WHERE user_id=?
       )
       GROUP BY m ORDER BY m DESC LIMIT 3
     )`,
    [userId, userId]
  );
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

  // ── Deudas ───────────────────────────────────────────────────
  const debtsRes = await db.execute(
    `SELECT * FROM debts WHERE user_id=?
     ORDER BY completed ASC, due_date IS NULL ASC, due_date ASC, created_at DESC`,
    [userId]
  );
  const paymentsRes = await db.execute(
    "SELECT * FROM debt_payments WHERE user_id=? ORDER BY date DESC, id DESC",
    [userId]
  );

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

  // ── Budgets ──────────────────────────────────────────────────
  const budgetsRes = await db.execute(
    "SELECT category, amount FROM budgets WHERE user_id=?",
    [userId]
  );
  const budgets: Record<string, number> = {};
  for (const r of budgetsRes.rows) budgets[String(r.category)] = toNum(r.amount);

  // ── Savings target ───────────────────────────────────────────
  const userRes = await db.execute(
    "SELECT savings_target FROM users WHERE id=?",
    [userId]
  );
  const savings_target = toNum(userRes.rows[0]?.savings_target ?? 20);

  return {
    monthly, by_category, by_cat_inc, recent, all_movs,
    month_inc, month_exp, balance, tasa_ahorro, savings_target,
    current_month, goals, debts, all_months, budgets, weekly,
  };
}
