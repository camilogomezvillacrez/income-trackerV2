"use client";

import { useEffect, useRef, useState } from "react";
import { X, Download } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
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
  "General":          "#6B7280",
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
      <circle cx="60" cy="60" r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      <circle
        cx="60" cy="60" r={r}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
    </svg>
  );
}

const GREEN = "#4A7C59";

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
        background: "#fff", borderRadius: "20px", width: "100%",
        maxWidth: "520px", maxHeight: "92vh", overflowY: "auto",
        position: "relative",
      }}>
        {/* Sticky header — not part of export */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px 12px", borderBottom: "0.5px solid #E5E7EB",
          position: "sticky", top: 0, background: "#fff", zIndex: 10,
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

        {/* Exportable content */}
        <div ref={reportRef} style={{ padding: "20px", background: "#fff" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#9CA3AF", fontSize: "13px" }}>
              Cargando informe...
            </div>
          ) : data ? (
            <>
              {/* ── HERO ────────────────────────────────────────── */}
              <div style={{
                background: GREEN, borderRadius: "18px",
                padding: "24px 22px", marginBottom: "14px", color: "#fff",
              }}>
                <div style={{ fontSize: "10px", fontWeight: 500, opacity: 0.75, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "8px" }}>
                  Balance {monthName(month)}
                </div>
                <div style={{ fontSize: "34px", fontWeight: 500, fontFamily: "var(--font-mono)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
                  {fmt(data.balance)}
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  {[
                    { label: "Ingresos", value: data.month_inc },
                    { label: "Gastos",   value: data.month_exp },
                  ].map((p) => (
                    <div key={p.label} style={{
                      background: "rgba(255,255,255,0.18)", borderRadius: "12px",
                      padding: "8px 14px", flex: 1,
                    }}>
                      <div style={{ fontSize: "9px", fontWeight: 500, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                        {p.label}
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
                        {fmt(p.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── AHORRO ──────────────────────────────────────── */}
              <div style={{
                background: "#fff",
                border: `0.5px solid ${tasaOk ? "#BBF7D0" : "#FECACA"}`,
                borderRadius: "18px", padding: "20px 22px", marginBottom: "14px",
                display: "flex", alignItems: "center", gap: "20px",
              }}>
                <div style={{ position: "relative", flexShrink: 0, width: "120px", height: "120px" }}>
                  <CircleProgress pct={data.tasa_ahorro} tasaOk={tasaOk} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "18px", fontWeight: 500, color: "#111827", fontFamily: "var(--font-mono)" }}>
                      {data.tasa_ahorro.toFixed(0)}%
                    </span>
                    <span style={{ fontSize: "9px", color: "#9CA3AF", marginTop: "2px" }}>ahorro</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{
                    display: "inline-block",
                    background: tasaOk ? "#DCFCE7" : "#FEE2E2",
                    color: tasaOk ? "#166534" : "#991B1B",
                    fontSize: "10px", fontWeight: 500,
                    padding: "3px 10px", borderRadius: "20px", marginBottom: "12px",
                  }}>
                    {tasaOk ? "Meta de ahorro lograda" : "Meta de ahorro no lograda"}
                  </span>
                  <div style={{ fontSize: "13px", color: "#374151", fontWeight: 400, marginBottom: "4px" }}>
                    Tasa de ahorro: <strong style={{ fontFamily: "var(--font-mono)" }}>{data.tasa_ahorro.toFixed(1)}%</strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "#9CA3AF" }}>
                    {tasaOk
                      ? `Superaste la meta por ${(data.tasa_ahorro - (data.savings_target ?? 20)).toFixed(1)} puntos`
                      : `Faltaron ${((data.savings_target ?? 20) - data.tasa_ahorro).toFixed(1)} puntos para la meta de ${data.savings_target}%`}
                  </div>
                </div>
              </div>

              {/* ── GASTOS POR CATEGORÍA ────────────────────────── */}
              {topCats.length > 0 && (
                <div style={{
                  background: "#fff", border: "0.5px solid #E5E7EB",
                  borderRadius: "18px", padding: "20px 22px", marginBottom: "14px",
                }}>
                  <div style={{ fontSize: "9px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                    Gastos por categoría
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {topCats.map((c) => {
                      const pct = data.month_exp > 0 ? Math.round((c.total / data.month_exp) * 100) : 0;
                      const color = getCatColor(c.category);
                      return (
                        <div key={c.category}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                              <span style={{ fontSize: "12px", fontWeight: 400, color: "#111827" }}>{c.category}</span>
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 400, color: "#374151", fontFamily: "var(--font-mono)" }}>
                              {fmt(c.total)}
                            </span>
                          </div>
                          <div style={{ height: "5px", background: "#F3F4F6", borderRadius: "3px", overflow: "hidden", marginBottom: "3px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px" }} />
                          </div>
                          <div style={{ fontSize: "10px", color: "#9CA3AF" }}>{pct}%</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── MAYOR GASTO ─────────────────────────────────── */}
              {topGasto && (
                <div style={{
                  background: "#fff8ee", border: "0.5px solid #f5c96e",
                  borderRadius: "18px", padding: "18px 22px", marginBottom: "14px",
                  display: "flex", alignItems: "center", gap: "14px",
                }}>
                  <span style={{ fontSize: "22px", flexShrink: 0 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "9px", fontWeight: 500, color: "#B45309", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}>
                      Mayor gasto del mes
                    </div>
                    <div style={{ fontSize: "13px", fontWeight: 400, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {topGasto.note || topGasto.category}
                    </div>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#DC2626", fontFamily: "var(--font-mono)", flexShrink: 0 }}>
                    {fmt(topGasto.amount)}
                  </div>
                </div>
              )}

              {/* ── METAS ───────────────────────────────────────── */}
              {data.goals.length > 0 && (
                <div style={{
                  background: "#fff", border: "0.5px solid #E5E7EB",
                  borderRadius: "18px", padding: "20px 22px", marginBottom: "14px",
                }}>
                  <div style={{ fontSize: "9px", fontWeight: 500, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "16px" }}>
                    Metas
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {data.goals.map((g) => (
                      <div key={g.id}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "15px" }}>{g.emoji}</span>
                            <span style={{ fontSize: "12px", fontWeight: 400, color: "#111827" }}>{g.name}</span>
                          </div>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: g.completed ? "#166534" : "#378ADD" }}>
                            {g.pct}%
                          </span>
                        </div>
                        <div style={{ height: "5px", background: "#F3F4F6", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(g.pct, 100)}%`, background: g.completed ? "#1D9E75" : "#378ADD", borderRadius: "3px" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── FOOTER ──────────────────────────────────────── */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                <span style={{ fontSize: "9px", color: "#D1D5DB", textTransform: "capitalize" }}>
                  {monthName(month)}
                </span>
                <span style={{ fontSize: "9px", color: "#D1D5DB" }}>
                  Mis Finanzas
                </span>
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
