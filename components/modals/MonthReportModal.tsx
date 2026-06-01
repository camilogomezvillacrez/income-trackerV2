"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download, TrendingUp, TrendingDown } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { CAT_META } from "@/constants/categories";
import { fmt } from "@/lib/utils";
import type { DashboardData } from "@/types";

function addMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthName(ym: string): string {
  const [y, m] = ym.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-CO", {
    month: "long",
    year: "numeric",
  });
}

function trendPct(current: number, prev: number) {
  if (!prev) return null;
  return Math.round(((current - prev) / prev) * 100);
}

export default function MonthReportModal({ month }: { month: string }) {
  const closeReport = useDashboardStore((s) => s.closeReport);
  const reportRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [prevData, setPrevData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function load() {
      const [r1, r2] = await Promise.all([
        fetch(`/api/dashboard?month=${month}`).then((r) => r.json()),
        fetch(`/api/dashboard?month=${addMonth(month, -1)}`).then((r) => r.json()),
      ]);
      setData(r1);
      setPrevData(r2);
      setLoading(false);
    }
    load();
  }, [month]);

  async function handleExport() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`informe-${month}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  const tasaOk = data && data.tasa_ahorro >= (data.savings_target ?? 20);
  const topCats = data?.by_category.slice(0, 5) ?? [];
  const topGasto = data?.all_movs
    .filter((r) => r.tipo === "gasto")
    .sort((a, b) => b.amount - a.amount)[0];

  const incTrend = prevData ? trendPct(data?.month_inc ?? 0, prevData.month_inc) : null;
  const expTrend = prevData ? trendPct(data?.month_exp ?? 0, prevData.month_exp) : null;

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
        background: "var(--white)", borderRadius: "16px", width: "100%",
        maxWidth: "560px", maxHeight: "90vh", overflowY: "auto",
        position: "relative", boxShadow: "0 24px 60px rgba(0,0,0,.18)",
      }}>
        {/* Sticky header fuera del área exportable */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 22px 14px", borderBottom: "1px solid var(--border)",
          position: "sticky", top: 0, background: "var(--white)", zIndex: 10,
          borderRadius: "16px 16px 0 0",
        }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Informe mensual
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", textTransform: "capitalize", marginTop: "2px" }}>
              {monthName(month)}
            </h2>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={handleExport}
              disabled={loading || exporting}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                background: "var(--text)", color: "#fff", border: "none",
                borderRadius: "8px", padding: "8px 14px", fontSize: "12px",
                fontWeight: 600, cursor: loading || exporting ? "not-allowed" : "pointer",
                opacity: loading || exporting ? 0.6 : 1,
                fontFamily: "var(--font-sans)",
              }}
            >
              <Download size={13} />
              {exporting ? "Generando..." : "Descargar PDF"}
            </button>
            <button
              onClick={closeReport}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px", display: "flex" }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido exportable */}
        <div ref={reportRef} style={{ padding: "22px", background: "#fff" }}>

          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontSize: "13px" }}>
              Cargando informe...
            </div>
          ) : data ? (
            <>
              {/* ── KPI grid ───────────────────────────────────── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                {[
                  {
                    label: "Ingresos", value: data.month_inc,
                    color: "#16a34a", bg: "#f0fdf4",
                    trend: incTrend, trendGoodIfUp: true,
                  },
                  {
                    label: "Gastos", value: data.month_exp,
                    color: "#dc2626", bg: "#fef2f2",
                    trend: expTrend, trendGoodIfUp: false,
                  },
                  {
                    label: "Balance", value: data.balance,
                    color: data.balance >= 0 ? "#16a34a" : "#dc2626",
                    bg: data.balance >= 0 ? "#f0fdf4" : "#fef2f2",
                    trend: null, trendGoodIfUp: true,
                  },
                ].map((k) => {
                  const isGood = k.trend !== null
                    ? (k.trendGoodIfUp ? k.trend > 0 : k.trend < 0)
                    : null;
                  return (
                    <div key={k.label} style={{
                      background: k.bg, borderRadius: "10px",
                      padding: "14px 12px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "10px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                        {k.label}
                      </div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: k.color, fontFamily: "var(--font-mono)", marginBottom: "4px" }}>
                        {fmt(k.value)}
                      </div>
                      {k.trend !== null && (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "3px", fontSize: "10px", color: isGood ? "#16a34a" : "#dc2626" }}>
                          {k.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                          {k.trend > 0 ? "+" : ""}{k.trend}% vs anterior
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Ahorro ─────────────────────────────────────── */}
              <div style={{
                background: tasaOk ? "#f0fdf4" : "#fffbeb",
                borderRadius: "10px", padding: "14px 16px", marginBottom: "20px",
                display: "flex", alignItems: "center", gap: "14px",
              }}>
                <div style={{
                  width: "52px", height: "52px", borderRadius: "50%",
                  background: tasaOk ? "#16a34a" : "#f59e0b",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: "11px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {data.tasa_ahorro.toFixed(0)}%
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: tasaOk ? "#16a34a" : "#92400e", marginBottom: "2px" }}>
                    {tasaOk ? "Meta de ahorro cumplida ✓" : "Meta de ahorro no alcanzada"}
                  </div>
                  <div style={{ fontSize: "11px", color: "#6b7280" }}>
                    Ahorraste {data.tasa_ahorro.toFixed(1)}% — meta: {data.savings_target}%
                  </div>
                  <div style={{ marginTop: "6px", height: "5px", background: "rgba(0,0,0,.08)", borderRadius: "3px", overflow: "hidden", position: "relative", width: "180px" }}>
                    <div style={{ height: "100%", width: `${Math.min(data.tasa_ahorro, 100)}%`, background: tasaOk ? "#16a34a" : "#f59e0b", borderRadius: "3px" }} />
                    <div style={{ position: "absolute", top: 0, bottom: 0, left: `${data.savings_target}%`, width: "2px", background: tasaOk ? "#15803d" : "#b45309" }} />
                  </div>
                </div>
              </div>

              {/* ── Gastos por categoría ───────────────────────── */}
              {topCats.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Gastos por categoría
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {topCats.map((c) => {
                      const meta = CAT_META[c.category] ?? { emoji: "⚪", color: "#6B7280" };
                      const pct = data.month_exp > 0 ? Math.round((c.total / data.month_exp) * 100) : 0;
                      const prev = prevData?.by_category.find((x) => x.category === c.category);
                      const tr = prev ? trendPct(c.total, prev.total) : null;
                      return (
                        <div key={c.category} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "18px", width: "26px", flexShrink: 0, textAlign: "center" }}>{meta.emoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{c.category}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {tr !== null && (
                                  <span style={{ fontSize: "10px", color: tr > 0 ? "#dc2626" : "#16a34a" }}>
                                    {tr > 0 ? "▲" : "▼"}{Math.abs(tr)}%
                                  </span>
                                )}
                                <span style={{ fontSize: "11px", color: "#6b7280", fontFamily: "var(--font-mono)" }}>
                                  {pct}% · {fmt(c.total)}
                                </span>
                              </div>
                            </div>
                            <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: meta.color, borderRadius: "3px" }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── Mayor gasto ────────────────────────────────── */}
              {topGasto && (
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  background: "#fefce8", border: "1px solid #fde68a",
                  borderRadius: "10px", padding: "12px 14px", marginBottom: "20px",
                }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>💸</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Mayor gasto del mes
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827", marginTop: "2px" }}>
                      {topGasto.note || topGasto.category}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 800, color: "#dc2626", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    {fmt(topGasto.amount)}
                  </div>
                </div>
              )}

              {/* ── Metas ─────────────────────────────────────── */}
              {data.goals.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                    Metas
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {data.goals.map((g) => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "16px", flexShrink: 0 }}>{g.emoji}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 600, color: "#111827" }}>{g.name}</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: g.completed ? "#16a34a" : "#2563eb" }}>
                              {g.pct}%
                            </span>
                          </div>
                          <div style={{ height: "5px", background: "#f3f4f6", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(g.pct, 100)}%`, background: g.completed ? "#16a34a" : "#2563eb", borderRadius: "3px" }} />
                          </div>
                        </div>
                        {g.completed && <span style={{ fontSize: "14px", flexShrink: 0 }}>✅</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Footer ────────────────────────────────────── */}
              <div style={{
                borderTop: "1px solid #f3f4f6", paddingTop: "14px",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "10px", color: "#9ca3af", textTransform: "capitalize" }}>
                  {monthName(month)}
                </span>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                  Income Tracker
                </span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--muted)", fontSize: "13px" }}>
              No se pudo cargar el informe.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
