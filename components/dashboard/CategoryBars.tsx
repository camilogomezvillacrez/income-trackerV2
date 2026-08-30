"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { CAT_META } from "@/constants/categories";
import { fmt } from "@/lib/utils";

export default function CategoryBars() {
  const data = useDashboardStore((s) => s.data);
  const setView = useDashboardStore((s) => s.setView);
  if (!data) return null;

  const { by_category, budgets } = data;
  const total = by_category.reduce((s, c) => s + c.total, 0);

  if (!by_category.length) {
    return (
      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "20px 0" }}>
        Sin gastos este mes
      </div>
    );
  }

  return (
    <div>
      {by_category.slice(0, 7).map((c) => {
        const meta = CAT_META[c.category] ?? { color: "#6B7280", emoji: "" };
        const pct = total > 0 ? Math.round((c.total / total) * 100) : 0;
        const budget = budgets[c.category];
        const over = budget && c.total > budget;

        return (
          <button
            key={c.category}
            onClick={() => setView(`cat-${c.category}`)}
            style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, marginBottom: "10px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: 500 }}>
                {meta.emoji} {c.category}
              </span>
              <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                {pct}% · {fmt(c.total)}
              </span>
            </div>
            <div style={{ height: "5px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  borderRadius: "3px",
                  width: `${pct}%`,
                  background: meta.color,
                  opacity: 0.8,
                }}
              />
            </div>
            {budget && (
              <>
                <div style={{ height: "3px", background: "var(--bg)", borderRadius: "2px", marginTop: "3px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: "2px",
                      width: `${Math.min(Math.round((c.total / budget) * 100), 100)}%`,
                      background: over ? "var(--red)" : meta.color,
                      transition: "width 0.4s",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    color: over ? "var(--red)" : "var(--muted)",
                    marginTop: "2px",
                    display: "block",
                  }}
                >
                  {over ? "⚠ Superado: " : ""}{fmt(c.total)} / {fmt(budget)} · {Math.round((c.total / budget) * 100)}%
                </span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
