"use client";

import { ChevronRight, Target } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

/*
 * Resumen de metas en la portada. Metas salio de la barra de abajo (seis
 * destinos no caben en 390px) y vive aqui: asi se ven al abrir la app en vez
 * de quedar detras de un toque. La vista completa sigue igual, detras de
 * "Ver todas".
 */
export default function MetasCard() {
  const { data, setView, openModal, privacyMode } = useDashboardStore();

  const goals = data?.goals ?? [];

  // Primero las que siguen en marcha: son las que dicen algo hoy.
  const shown = [...goals]
    .sort((a, b) => a.completed - b.completed || b.pct - a.pct)
    .slice(0, 3);

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: goals.length ? "12px" : "10px" }}>
        <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          Metas
        </p>
        {goals.length > 0 && (
          <button
            onClick={() => setView("metas")}
            style={{ display: "flex", alignItems: "center", gap: "2px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "#4A7C59", padding: "4px 0" }}
          >
            Ver todas <ChevronRight size={13} />
          </button>
        )}
      </div>

      {goals.length === 0 ? (
        <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
          <Target size={20} color="var(--muted)" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "12px" }}>
            Aún no tienes metas de ahorro.
          </p>
          <button
            onClick={() => openModal("meta")}
            style={{ background: "#4A7C59", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Crear una meta
          </button>
        </div>
      ) : (
        shown.map((g, i) => (
          <button
            key={g.id}
            onClick={() => setView("metas")}
            style={{
              display: "grid", gridTemplateColumns: "30px 1fr auto", gap: "10px",
              alignItems: "center", width: "100%", textAlign: "left",
              background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)",
              padding: i === 0 ? "0 0 10px" : "10px 0",
              borderTop: i === 0 ? "none" : "1px solid var(--bg)",
            }}
          >
            <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
              {g.emoji}
            </span>

            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "var(--text)", marginBottom: "5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {g.name}
              </span>
              <span style={{ display: "block", height: "6px", borderRadius: "3px", background: "var(--bg)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", borderRadius: "3px", background: "#4A7C59", width: `${Math.min(100, Math.max(0, g.pct))}%` }} />
              </span>
              <span style={{ display: "block", fontSize: "10px", color: "var(--muted)", marginTop: "4px", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
                {privacyMode ? "•••••• de ••••••" : `${fmt(g.saved)} de ${fmt(g.target)}`}
              </span>
            </span>

            <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "#4A7C59", fontVariantNumeric: "tabular-nums" }}>
              {Math.round(g.pct)}%
            </span>
          </button>
        ))
      )}
    </div>
  );
}
