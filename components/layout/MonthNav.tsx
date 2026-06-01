"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { currentMonth } from "@/lib/utils";

function addMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function MonthNav() {
  const { activeMonth, setMonth, refresh } = useDashboardStore();

  const isCurrentMonth = activeMonth >= currentMonth();

  function navigate(dir: -1 | 1) {
    const next = addMonth(activeMonth, dir);
    if (dir === 1 && next > currentMonth()) return; // no ir al futuro
    setMonth(next);
  }

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "2px",
        background: "var(--bg)", border: "1px solid var(--border)",
        borderRadius: "20px", padding: "2px 4px",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sub)", display: "flex", alignItems: "center", padding: "2px 6px", borderRadius: "14px", lineHeight: 1 }}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>

      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)", minWidth: "62px", textAlign: "center" }}>
        {activeMonth}
      </span>

      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        style={{ background: "none", border: "none", cursor: isCurrentMonth ? "default" : "pointer", color: "var(--sub)", opacity: isCurrentMonth ? 0.3 : 1, display: "flex", alignItems: "center", padding: "2px 6px", borderRadius: "14px", lineHeight: 1 }}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
