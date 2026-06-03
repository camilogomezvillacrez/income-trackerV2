"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";
import type { DashboardData } from "@/types";

function monthName(ym: string): string {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

const REPORT_CAT_COLORS: Record<string, string> = {
  "Alimentación":     "#378ADD",
  "Vivienda":         "#1D9E75",
  "Suscripciones":    "#7F77DD",
  "Cuidado personal": "#D85A30",
  "Entretenimiento":  "#D4537E",
  "Transporte":       "#F59E0B",
  "Salud":            "#9D174D",
  "Ropa":             "#065F46",
  "Deudas":           "#991B1B",
  "Ahorro":           "#374151",
  "Educación":        "#1D4ED8",
  "Gastos hormiga":   "#B45309",
  "Tecnología":       "#0369A1",
};

function getCatColor(name: string): string {
  return REPORT_CAT_COLORS[name] ?? "#6B7280";
}

function CircleProgress({ pct, tasaOk }: { pct: number; tasaOk: boolean }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 100) / 100);
  const color = tasaOk ? "#1D9E75" : "#DC2626";
  return (
    <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#E5E7EB" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

const GREEN = "#4A7C59";
const MONO = "'Courier New', Courier, monospace";
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "11px", fontWeight: 600, color: "#4B5563",
      textTransform: "uppercase", letterSpacing: "0.09em",
      marginBottom: "16px", paddingBottom: "8px",
      borderBottom: "1px solid #F3F4F6",
    }}>{children}</div>
  );
}

// ── Builds a completely self-contained HTML string for PDF export ──────────────
function buildReportHTML(data: DashboardData, month: string): string {
  const tasaOk = data.tasa_ahorro >= (data.savings_target ?? 20);
  const topCats = data.by_category.slice(0, 5);
  const topGasto = [...data.all_movs]
    .filter((r) => r.tipo === "gasto")
    .sort((a, b) => b.amount - a.amount)[0];
  const name = monthName(month);

  const r = 44;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(data.tasa_ahorro, 100) / 100);
  const circleColor = tasaOk ? "#1D9E75" : "#DC2626";

  const catsRows = topCats.map((c) => {
    const pct = data.month_exp > 0 ? Math.round((c.total / data.month_exp) * 100) : 0;
    const color = getCatColor(c.category);
    return `
      <div style="margin-bottom:18px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;flex-shrink:0;"></span>
            <span style="font-size:14px;color:#111827;font-family:${SANS};">${c.category}</span>
          </div>
          <span style="font-size:14px;color:#374151;font-family:${MONO};">${fmt(c.total)}</span>
        </div>
        <div style="height:7px;background:#F3F4F6;border-radius:4px;overflow:hidden;margin-bottom:5px;">
          <div style="height:100%;width:${pct}%;background:${color};border-radius:4px;"></div>
        </div>
        <span style="font-size:12px;color:#6B7280;font-weight:500;font-family:${SANS};">${pct}%</span>
      </div>`;
  }).join("");

  const goalsRows = data.goals.map((g) => `
    <div style="margin-bottom:18px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:17px;">${g.emoji}</span>
          <span style="font-size:14px;color:#111827;font-family:${SANS};">${g.name}</span>
        </div>
        <span style="font-size:14px;font-weight:600;color:${g.completed ? "#166534" : "#378ADD"};font-family:${SANS};">${g.pct}%</span>
      </div>
      <div style="height:7px;background:#F3F4F6;border-radius:4px;overflow:hidden;">
        <div style="height:100%;width:${Math.min(g.pct, 100)}%;background:${g.completed ? "#1D9E75" : "#378ADD"};border-radius:4px;"></div>
      </div>
    </div>`).join("");

  const mayorGastoBlock = topGasto ? `
    <div style="background:#fff8ee;border:1.5px solid #f5c96e;border-radius:18px;padding:22px 26px;margin-bottom:14px;display:flex;align-items:center;gap:18px;">
      <span style="font-size:26px;flex-shrink:0;">⚠️</span>
      <div style="flex:1;min-width:0;">
        <div style="font-size:12px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.09em;margin-bottom:6px;font-family:${SANS};">Mayor gasto del mes</div>
        <div style="font-size:15px;color:#111827;font-family:${SANS};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${topGasto.note || topGasto.category}</div>
      </div>
      <div style="font-size:16px;font-weight:700;color:#DC2626;font-family:${MONO};flex-shrink:0;">${fmt(topGasto.amount)}</div>
    </div>` : "";

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:${SANS};background:#f2f4f7;padding:30px;}
</style></head>
<body>

<div style="background:${GREEN};border-radius:20px;padding:28px 26px;margin-bottom:14px;color:#fff;">
  <div style="font-size:12px;font-weight:600;opacity:0.8;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:10px;">Balance ${name}</div>
  <div style="font-size:40px;font-weight:500;font-family:${MONO};margin-bottom:20px;letter-spacing:-0.02em;">${fmt(data.balance)}</div>
  <div style="display:flex;gap:12px;">
    <div style="background:rgba(255,255,255,.2);border-radius:14px;padding:12px 18px;flex:1;">
      <div style="font-size:11px;font-weight:600;opacity:0.85;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Ingresos</div>
      <div style="font-size:17px;font-weight:500;font-family:${MONO};">${fmt(data.month_inc)}</div>
    </div>
    <div style="background:rgba(255,255,255,.2);border-radius:14px;padding:12px 18px;flex:1;">
      <div style="font-size:11px;font-weight:600;opacity:0.85;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;">Gastos</div>
      <div style="font-size:17px;font-weight:500;font-family:${MONO};">${fmt(data.month_exp)}</div>
    </div>
  </div>
</div>

<div style="background:#fff;border:1.5px solid ${tasaOk ? "#BBF7D0" : "#FECACA"};border-radius:20px;padding:24px 26px;margin-bottom:14px;display:flex;align-items:center;gap:22px;">
  <div style="position:relative;flex-shrink:0;width:120px;height:120px;">
    <svg width="120" height="120" style="transform:rotate(-90deg);">
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="10"/>
      <circle cx="60" cy="60" r="${r}" fill="none" stroke="${circleColor}" stroke-width="10"
        stroke-dasharray="${circ.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" stroke-linecap="round"/>
    </svg>
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;">
      <span style="font-size:22px;font-weight:600;color:#111827;font-family:${MONO};">${data.tasa_ahorro.toFixed(0)}%</span>
      <span style="font-size:11px;color:#6B7280;margin-top:2px;font-family:${SANS};">ahorro</span>
    </div>
  </div>
  <div style="flex:1;">
    <div style="display:inline-block;background:${tasaOk ? "#DCFCE7" : "#FEE2E2"};color:${tasaOk ? "#166534" : "#991B1B"};font-size:12px;font-weight:700;padding:5px 14px;border-radius:20px;margin-bottom:16px;font-family:${SANS};">
      ${tasaOk ? "✓ Meta de ahorro lograda" : "✗ Meta de ahorro no lograda"}
    </div>
    <div style="font-size:14px;color:#374151;margin-bottom:8px;font-family:${SANS};">
      Tasa de ahorro: <strong style="font-family:${MONO};">${data.tasa_ahorro.toFixed(1)}%</strong>
    </div>
    <div style="font-size:13px;color:#6B7280;font-family:${SANS};">
      ${tasaOk
        ? `Superaste la meta por ${(data.tasa_ahorro - (data.savings_target ?? 20)).toFixed(1)} puntos`
        : `Faltaron ${((data.savings_target ?? 20) - data.tasa_ahorro).toFixed(1)} puntos para la meta de ${data.savings_target}%`}
    </div>
  </div>
</div>

${topCats.length > 0 ? `
<div style="background:#fff;border:1.5px solid #E5E7EB;border-radius:20px;padding:24px 26px;margin-bottom:14px;">
  <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:18px;padding-bottom:10px;border-bottom:1.5px solid #F3F4F6;font-family:${SANS};">Gastos por categoría</div>
  ${catsRows}
</div>` : ""}

${mayorGastoBlock}

${data.goals.length > 0 ? `
<div style="background:#fff;border:1.5px solid #E5E7EB;border-radius:20px;padding:24px 26px;margin-bottom:14px;">
  <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:18px;padding-bottom:10px;border-bottom:1.5px solid #F3F4F6;font-family:${SANS};">Metas</div>
  ${goalsRows}
</div>` : ""}

<div style="display:flex;justify-content:space-between;align-items:center;padding-top:14px;border-top:1px solid #E5E7EB;">
  <span style="font-size:12px;color:#9CA3AF;text-transform:capitalize;font-family:${SANS};">${name}</span>
  <span style="font-size:12px;color:#9CA3AF;font-weight:600;font-family:${SANS};">Mis Finanzas</span>
</div>

</body></html>`;
}

export default function MonthReportModal({ month }: { month: string }) {
  const closeReport = useDashboardStore((s) => s.closeReport);
  const reportRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const r1 = await fetch(`/api/dashboard?month=${month}`).then((r) => r.json());
      setData(r1);
      setLoading(false);
    }
    load();
  }, [month]);

  async function handleExport() {
    if (!data) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Build completely standalone HTML — no CSS variables, no React DOM dependency
      const html = buildReportHTML(data, month);

      // Render off-screen in a fixed-width container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "600px";
      container.style.zIndex = "-1";
      container.innerHTML = html;
      document.body.appendChild(container);

      // Wait for layout
      await new Promise((r) => setTimeout(r, 150));

      const target = container.querySelector("body") as HTMLElement ?? container;
      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f2f4f7",
        windowWidth: 600,
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const pdfW = 210;
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pdfW, pdfH] });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`informe-${month}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const tasaOk = data ? data.tasa_ahorro >= (data.savings_target ?? 20) : false;
  const topCats = data?.by_category.slice(0, 5) ?? [];
  const topGasto = data?.all_movs
    .filter((r) => r.tipo === "gasto")
    .sort((a, b) => b.amount - a.amount)[0];

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) closeReport(); }}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
        zIndex: 400, display: "flex", alignItems: "center",
        justifyContent: "center", padding: "16px",
      }}
    >
      <div style={{
        background: "#f2f4f7", borderRadius: "20px", width: "100%",
        maxWidth: "520px", maxHeight: "92vh", overflowY: "auto",
        position: "relative",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px", borderBottom: "1px solid #E5E7EB",
          position: "sticky", top: 0, background: "#f2f4f7", zIndex: 10,
          borderRadius: "20px 20px 0 0",
        }}>
          <div>
            <div style={{ fontSize: "9px", color: "#9CA3AF", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Informe mensual
            </div>
            <h2 style={{ fontSize: "16px", fontWeight: 500, color: "#111827", textTransform: "capitalize", marginTop: "2px" }}>
              {monthName(month)}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleExport}
              disabled={loading || exporting}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: GREEN, color: "#fff", border: "none",
                borderRadius: "10px", padding: "8px 14px", fontSize: "12px",
                fontWeight: 500, cursor: loading || exporting ? "not-allowed" : "pointer",
                opacity: loading || exporting ? 0.6 : 1,
                fontFamily: "var(--font-sans)",
              }}
            >
              <Download size={13} />
              {exporting ? "Generando..." : "Descargar PDF"}
            </button>
            <button
              onClick={closeReport}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", padding: "4px", display: "flex" }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Preview (in-modal) */}
        <div ref={reportRef} style={{ padding: "20px", background: "#f2f4f7", display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: "13px" }}>
              Cargando informe...
            </div>
          ) : data ? (
            <>
              {/* HERO */}
              <div style={{ background: GREEN, borderRadius: "18px", padding: "26px 24px", color: "#fff" }}>
                <div style={{ fontSize: "11px", fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>
                  Balance {monthName(month)}
                </div>
                <div style={{ fontSize: "36px", fontWeight: 500, fontFamily: "var(--font-mono)", marginBottom: "18px", letterSpacing: "-0.02em" }}>
                  {fmt(data.balance)}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[{ label: "Ingresos", value: data.month_inc }, { label: "Gastos", value: data.month_exp }].map((p) => (
                    <div key={p.label} style={{ background: "rgba(255,255,255,0.18)", borderRadius: "12px", padding: "10px 16px", flex: 1 }}>
                      <div style={{ fontSize: "10px", fontWeight: 500, opacity: 0.85, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "5px" }}>{p.label}</div>
                      <div style={{ fontSize: "15px", fontWeight: 500, fontFamily: "var(--font-mono)" }}>{fmt(p.value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AHORRO */}
              <div style={{ background: "#fff", border: `1px solid ${tasaOk ? "#BBF7D0" : "#FECACA"}`, borderRadius: "18px", padding: "22px 24px", display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ position: "relative", flexShrink: 0, width: "120px", height: "120px" }}>
                  <CircleProgress pct={data.tasa_ahorro} tasaOk={tasaOk} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px", fontWeight: 500, color: "#111827", fontFamily: "var(--font-mono)" }}>{data.tasa_ahorro.toFixed(0)}%</span>
                    <span style={{ fontSize: "10px", color: "#6B7280", marginTop: "2px" }}>ahorro</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ display: "inline-block", background: tasaOk ? "#DCFCE7" : "#FEE2E2", color: tasaOk ? "#166534" : "#991B1B", fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "20px", marginBottom: "12px" }}>
                    {tasaOk ? "✓ Meta de ahorro lograda" : "✗ Meta de ahorro no lograda"}
                  </span>
                  <div style={{ fontSize: "13px", color: "#374151", marginBottom: "6px" }}>
                    Tasa de ahorro: <strong style={{ fontFamily: "var(--font-mono)" }}>{data.tasa_ahorro.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280" }}>
                    {tasaOk ? `Superaste la meta por ${(data.tasa_ahorro - (data.savings_target ?? 20)).toFixed(1)} puntos` : `Faltaron ${((data.savings_target ?? 20) - data.tasa_ahorro).toFixed(1)} puntos para la meta de ${data.savings_target}%`}
                  </div>
                </div>
              </div>

              {/* CATEGORÍAS */}
              {topCats.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "18px", padding: "22px 24px" }}>
                  <SectionLabel>Gastos por categoría</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {topCats.map((c) => {
                      const pct = data.month_exp > 0 ? Math.round((c.total / data.month_exp) * 100) : 0;
                      const color = getCatColor(c.category);
                      return (
                        <div key={c.category}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                              <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                              <span style={{ fontSize: "13px", color: "#111827" }}>{c.category}</span>
                            </div>
                            <span style={{ fontSize: "13px", color: "#374151", fontFamily: "var(--font-mono)" }}>{fmt(c.total)}</span>
                          </div>
                          <div style={{ height: "6px", background: "#F3F4F6", borderRadius: "3px", overflow: "hidden", marginBottom: "4px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px" }} />
                          </div>
                          <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 500 }}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MAYOR GASTO */}
              {topGasto && (
                <div style={{ background: "#fff8ee", border: "1px solid #f5c96e", borderRadius: "18px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "16px" }}>
                  <span style={{ fontSize: "24px", flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.09em", marginBottom: "5px" }}>Mayor gasto del mes</div>
                    <div style={{ fontSize: "14px", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{topGasto.note || topGasto.category}</div>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#DC2626", fontFamily: "var(--font-mono)", flexShrink: 0 }}>{fmt(topGasto.amount)}</div>
                </div>
              )}

              {/* METAS */}
              {data.goals.length > 0 && (
                <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: "18px", padding: "22px 24px" }}>
                  <SectionLabel>Metas</SectionLabel>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {data.goals.map((g) => (
                      <div key={g.id}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "7px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                            <span style={{ fontSize: "16px" }}>{g.emoji}</span>
                            <span style={{ fontSize: "13px", color: "#111827" }}>{g.name}</span>
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: g.completed ? "#166534" : "#378ADD" }}>{g.pct}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#F3F4F6", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(g.pct, 100)}%`, background: g.completed ? "#1D9E75" : "#378ADD", borderRadius: "3px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FOOTER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px 4px", borderTop: "1px solid #E5E7EB" }}>
                <span style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "capitalize" }}>{monthName(month)}</span>
                <span style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 500 }}>Mis Finanzas</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: "13px" }}>
              No se pudo cargar el informe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
