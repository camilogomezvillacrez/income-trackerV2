"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { CAT_META, EXP_CATS } from "@/constants/categories";
import { fmt } from "@/lib/utils";
import type { ViewType } from "@/types";

export default function CategoriasView() {
  const { data, setView } = useDashboardStore();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "10px",
      }}
    >
      {EXP_CATS.map((name) => {
        const m = CAT_META[name];
        const cat = data?.by_category.find((c) => c.category === name);
        const total = cat ? `${fmt(cat.total)} este mes` : "Sin gastos este mes";
        const catView: ViewType = `cat-${name}`;

        return (
          <button
            key={name}
            onClick={() => setView(catView)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px",
              background: "var(--white)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textAlign: "left",
              transition: "background 0.15s",
            }}
          >
            <span
              style={{
                fontSize: "28px",
                lineHeight: 1,
                flexShrink: 0,
                background: m.bg,
                padding: "8px",
                borderRadius: "10px",
              }}
            >
              {m.emoji}
            </span>
            <span>
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", display: "block" }}>
                {name}
              </span>
              <span style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", display: "block" }}>
                {total}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
