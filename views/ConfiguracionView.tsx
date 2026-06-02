"use client";

import { useState } from "react";
import { Settings, Target, FileText, ArrowLeft } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";

export default function ConfiguracionView() {
  const { data, refresh, activeMonth, openReport, setView } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const currentTarget = data?.savings_target ?? 20;
  const [targetInput, setTargetInput] = useState(String(currentTarget));
  const [saving, setSaving] = useState(false);

  async function saveSavingsTarget() {
    const val = parseFloat(targetInput);
    if (isNaN(val) || val < 0 || val > 100) { toast("Ingresa un valor entre 0 y 100", "err"); return; }
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ savings_target: val }),
    });
    await refresh();
    toast("✓ Configuración guardada");
    setSaving(false);
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setView("resumen")}
          aria-label="Volver al inicio"
          style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div style={{ width: "1px", height: "16px", background: "var(--border)" }} />
        <Settings size={20} color="var(--muted)" />
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Configuración</h2>
      </div>

      {/* Savings rate */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <Target size={16} color="var(--purple)" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Meta de tasa de ahorro</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
          Define qué porcentaje de tus ingresos quieres ahorrar cada mes. La tarjeta de KPI usará este objetivo para mostrarte si lo estás cumpliendo.
        </p>

        {/* Visual indicator */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--muted)" }}>Tu tasa actual este mes</span>
            <span style={{ fontSize: "12px", fontWeight: 700, color: data && data.tasa_ahorro >= currentTarget ? "var(--green)" : "var(--amber)", fontFamily: "var(--font-mono)" }}>
              {data?.tasa_ahorro.toFixed(1) ?? "—"}%
            </span>
          </div>
          <div style={{ height: "8px", background: "var(--bg)", borderRadius: "4px", overflow: "hidden", position: "relative" }}>
            <div style={{ height: "100%", width: `${Math.min(data?.tasa_ahorro ?? 0, 100)}%`, background: data && data.tasa_ahorro >= currentTarget ? "var(--green)" : "var(--amber)", borderRadius: "4px", transition: "width 0.5s" }} />
            {/* Target marker */}
            <div style={{ position: "absolute", top: 0, bottom: 0, left: `${currentTarget}%`, width: "2px", background: "var(--purple)", transform: "translateX(-1px)" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
            <span style={{ fontSize: "10px", color: "var(--purple)" }}>▲ meta: {currentTarget}%</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <input
              type="number"
              min={0} max={100} step={1}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              style={{ width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 36px 10px 12px", fontSize: "14px", fontFamily: "var(--font-mono)", color: "var(--text)", outline: "none", fontVariantNumeric: "tabular-nums" }}
            />
            <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", fontSize: "13px", fontWeight: 600 }}>%</span>
          </div>
          <button
            onClick={saveSavingsTarget}
            disabled={saving}
            style={{ background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 20px", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", opacity: saving ? 0.7 : 1, whiteSpace: "nowrap" }}
          >
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
          {[10, 20, 30, 50].map((v) => (
            <button
              key={v}
              onClick={() => setTargetInput(String(v))}
              style={{ padding: "4px 10px", border: `1px solid ${Number(targetInput) === v ? "var(--purple)" : "var(--border)"}`, borderRadius: "20px", background: Number(targetInput) === v ? "var(--purple-bg)" : "var(--bg)", color: Number(targetInput) === v ? "var(--purple)" : "var(--muted)", fontSize: "11px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s" }}
            >
              {v}%
            </button>
          ))}
        </div>
      </div>

      {/* Informe mensual */}
      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
          <FileText size={16} color="var(--blue)" />
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Informe mensual</span>
        </div>
        <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "16px", lineHeight: 1.6 }}>
          Genera un resumen visual de ingresos, gastos, categorías y metas del mes seleccionado. Puedes descargarlo como PDF.
        </p>
        <button
          onClick={() => openReport(activeMonth)}
          style={{
            display: "flex", alignItems: "center", gap: "8px",
            background: "var(--blue)", color: "#fff", border: "none",
            borderRadius: "8px", padding: "10px 18px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)",
            width: "100%", justifyContent: "center",
          }}
        >
          <FileText size={15} />
          Generar informe de {new Date(Number(activeMonth.split("-")[0]), Number(activeMonth.split("-")[1]) - 1, 1).toLocaleDateString("es-CO", { month: "long", year: "numeric" })}
        </button>
      </div>
    </div>
  );
}
