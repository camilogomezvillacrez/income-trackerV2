import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { get } from "@vercel/blob";
import { groupByCompany } from "@/lib/receiptGroups";
import { getDb } from "@/lib/db";
import { getAuthUser, unauthorized } from "@/lib/auth";
import { currentMonth, monthLabel } from "@/lib/utils";

const MONEY = '"$"#,##0';

// Miniatura de la foto en la hoja Facturas (px). La columna mide unos 7px por unidad de ancho.
const THUMB_W = 110;
const THUMB_H = 150;
const THUMB_COL_WIDTH = 17;

export const maxDuration = 60;

function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function parseRaw(v: unknown): Record<string, unknown> {
  if (typeof v !== "string") return {};
  try {
    const o = JSON.parse(v);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

interface Foto {
  buffer: Buffer;
  ext: "jpeg" | "png";
  width: number;
  height: number;
}

/** Ancho y alto leídos de la cabecera, sin decodificar la imagen. Excel solo acepta JPEG y PNG. */
function imageInfo(buf: Buffer): Omit<Foto, "buffer"> | null {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { ext: "png", width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0..SOF15 salvo DHT (C4), JPG (C8) y DAC (CC)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { ext: "jpeg", height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

/** Baja las fotos del Blob privado de a pocas; una que falle no tumba el Excel. */
async function loadImages(list: { id: number; path: string }[]): Promise<Map<number, Foto>> {
  const out = new Map<number, Foto>();
  const BATCH = 8;
  for (let i = 0; i < list.length; i += BATCH) {
    await Promise.all(
      list.slice(i, i + BATCH).map(async ({ id, path }) => {
        try {
          const blob = await get(path, { access: "private" });
          if (!blob?.stream) return;
          const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer());
          const info = imageInfo(buffer);
          if (info && info.width > 0 && info.height > 0) out.set(id, { buffer, ...info });
        } catch {
          // sin foto en esa fila
        }
      })
    );
  }
  return out;
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

  const receipts = await db.execute(
    "SELECT * FROM receipts WHERE user_id=? ORDER BY date(fecha) DESC, id DESC",
    [uid]
  );

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

  // ── 10 y 11. Facturas agrupadas por empresa, con la foto ──
  // Los datos del emisor (NIT, correo, teléfono) solo viven aquí: el gasto en
  // Movimientos no los guarda, y son los que pide la contabilidad formal.
  const recibos = receipts.rows.map((r) => {
    const raw = parseRaw(r.raw_ai_json);
    return {
      id: Number(r.id),
      image_url: String(r.image_url),
      proveedor: r.proveedor ? String(r.proveedor) : null,
      nit: r.nit ? String(r.nit) : null,
      valor: r.valor === null ? null : toNum(r.valor),
      fecha: r.fecha ? String(r.fecha) : null,
      categoria: r.categoria ? String(r.categoria) : "",
      correo: r.correo ? String(r.correo) : "",
      telefono: r.telefono ? String(r.telefono) : "",
      // Solo lo leyó la IA, el formulario no los pide
      factura: str(raw.factura),
      direccion: str(raw.direccion),
      iva: typeof raw.iva === "number" ? raw.iva : null,
      nota: str(raw.nota),
    };
  });
  const empresas = groupByCompany(recibos);
  const fotos = await loadImages(recibos.map((r) => ({ id: r.id, path: r.image_url })));

  // 10. Empresas: una fila por empresa para ubicarse rápido
  const ws10 = wb.addWorksheet("Empresas");
  setupSheet(ws10, [
    { header: "Empresa", key: "proveedor", width: 32 },
    { header: "NIT", key: "nit", width: 16 },
    { header: "Facturas", key: "n", width: 10 },
    { header: "Total", key: "total", width: 15, money: true },
    { header: "Última factura", key: "ultima", width: 14 },
    { header: "Correo", key: "correo", width: 28 },
    { header: "Teléfono", key: "telefono", width: 16 },
    { header: "Dirección", key: "direccion", width: 30 },
  ]);
  for (const g of [...empresas].sort((a, b) => b.total - a.total)) {
    const dato = (k: "correo" | "telefono" | "direccion") => g.items.find((i) => i[k])?.[k] ?? "";
    ws10.addRow({
      proveedor: g.proveedor,
      nit: g.nit ?? "",
      n: g.items.length,
      total: g.total,
      ultima: g.items[0]?.fecha ?? "",
      correo: dato("correo"),
      telefono: dato("telefono"),
      direccion: dato("direccion"),
    });
  }

  // 11. Facturas: bloque por empresa, cada factura con su foto al lado
  const ws11 = wb.addWorksheet("Facturas");
  setupSheet(ws11, [
    { header: "Foto", key: "foto", width: THUMB_COL_WIDTH },
    { header: "Fecha", key: "fecha", width: 12 },
    { header: "N° factura", key: "factura", width: 16 },
    { header: "Valor", key: "valor", width: 15, money: true },
    { header: "IVA", key: "iva", width: 13, money: true },
    { header: "Categoría", key: "categoria", width: 18 },
    { header: "Descripción", key: "nota", width: 30 },
  ]);
  const LAST_COL = 7;

  for (const g of empresas) {
    const contacto = [g.items.find((i) => i.telefono)?.telefono, g.items.find((i) => i.correo)?.correo]
      .filter(Boolean)
      .join(" · ");

    const band = ws11.addRow([]);
    ws11.mergeCells(band.number, 1, band.number, LAST_COL);
    band.getCell(1).value = `${g.proveedor.toUpperCase()}${g.nit ? `   ·   NIT ${g.nit}` : ""}${contacto ? `   ·   ${contacto}` : ""}`;
    band.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 12 };
    band.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3730A3" } };
    band.alignment = { vertical: "middle" };
    band.height = 24;

    for (const r of g.items) {
      const row = ws11.addRow({
        fecha: r.fecha ?? "",
        factura: r.factura ?? "",
        valor: r.valor ?? "",
        iva: r.iva ?? "",
        categoria: r.categoria,
        nota: r.nota ?? "",
      });
      row.alignment = { vertical: "top", wrapText: true };

      const foto = fotos.get(r.id);
      if (foto) {
        // Se incrusta la foto completa: Excel muestra la miniatura y al
        // agrandarla se lee el recibo entero
        const imageId = wb.addImage({ buffer: foto.buffer as unknown as ExcelJS.Buffer, extension: foto.ext });
        const scale = Math.min(THUMB_W / foto.width, THUMB_H / foto.height);
        const w = Math.round(foto.width * scale);
        const h = Math.round(foto.height * scale);
        ws11.addImage(imageId, {
          tl: { col: 0.08, row: row.number - 1 + 0.08 },
          ext: { width: w, height: h },
          editAs: "oneCell",
        });
        row.height = (h + 12) * 0.75; // px → puntos
      } else {
        row.getCell("foto").value = "sin foto";
        row.getCell("foto").font = { italic: true, color: { argb: "FF9CA3AF" } };
      }
    }

    const sub = ws11.addRow({ factura: `Total ${g.items.length === 1 ? "1 factura" : `${g.items.length} facturas`}`, valor: g.total });
    sub.font = { bold: true };
    sub.getCell("factura").alignment = { horizontal: "right" };
    for (let c = 1; c <= LAST_COL; c++) {
      sub.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEF2FF" } };
    }

    ws11.addRow([]);
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
