"use client";

import { useEffect, useState } from "react";
import { Bot, RefreshCw } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

export default function AIRecommendations() {
  const data = useDashboardStore((s) => s.data);
  const [recs, setRecs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    if (!data) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: data.current_month,
          month_inc: data.month_inc,
          month_exp: data.month_exp,
          balance: data.balance,
          tasa_ahorro: data.tasa_ahorro,
          by_category: data.by_category,
          goals: data.goals,
        }),
      });
      const json = await res.json();
      setRecs(json.recommendations ?? []);
    } catch {
      setRecs(["No se pudo cargar el análisis IA."]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (data && recs.length === 0) load();
  }, [data?.current_month]);

  const colors = ["#3B6D11", "#B45309", "#991B1B", "#1D4ED8"];

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px",
        marginBottom: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
        <Bot size={16} color="#4338CA" />
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>Recomendaciones IA</span>
        <span
          style={{
            fontSize: "9px",
            background: "#EEF2FF",
            color: "#4338CA",
            padding: "2px 8px",
            borderRadius: "10px",
            fontWeight: 600,
          }}
        >
          Claude
        </span>
        <button
          onClick={load}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--muted)",
            fontSize: "11px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontFamily: "var(--font-sans)",
          }}
        >
          <RefreshCw size={12} /> actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
          🤖 Analizando tus finanzas con IA...
        </div>
      ) : recs.length === 0 ? (
        <div style={{ color: "var(--muted)", fontSize: "12px", textAlign: "center", padding: "12px 0" }}>
          Sin datos suficientes para analizar.
        </div>
      ) : (
        recs.map((rec, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "10px",
              padding: "8px 0",
              borderBottom: i < recs.length - 1 ? "1px solid var(--border)" : "none",
            }}
          >
            <div
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: colors[i % 4],
                flexShrink: 0,
                marginTop: "5px",
              }}
            />
            <div style={{ fontSize: "12px", color: "var(--sub)", lineHeight: 1.6 }}>{rec}</div>
          </div>
        ))
      )}
    </div>
  );
}
