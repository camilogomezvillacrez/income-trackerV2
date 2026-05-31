"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";

export default function MonthNav() {
  const { data, activeMonth, setMonth, refresh } = useDashboardStore();
  const months = data?.all_months ?? [];
  const idx = months.indexOf(activeMonth);

  function navigate(dir: -1 | 1) {
    // months is DESC: lower index = newer
    const newIdx = idx - dir;
    if (newIdx >= 0 && newIdx < months.length) {
      setMonth(months[newIdx]);
      refresh();
    }
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "20px",
        padding: "2px 4px",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        disabled={idx >= months.length - 1}
        style={{
          background: "none",
          border: "none",
          cursor: idx >= months.length - 1 ? "default" : "pointer",
          color: "var(--sub)",
          opacity: idx >= months.length - 1 ? 0.3 : 1,
          display: "flex",
          alignItems: "center",
          padding: "2px 6px",
          borderRadius: "14px",
          lineHeight: 1,
        }}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={16} />
      </button>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 600,
          color: "var(--text)",
          minWidth: "62px",
          textAlign: "center",
        }}
      >
        {activeMonth}
      </span>
      <button
        onClick={() => navigate(1)}
        disabled={idx <= 0}
        style={{
          background: "none",
          border: "none",
          cursor: idx <= 0 ? "default" : "pointer",
          color: "var(--sub)",
          opacity: idx <= 0 ? 0.3 : 1,
          display: "flex",
          alignItems: "center",
          padding: "2px 6px",
          borderRadius: "14px",
          lineHeight: 1,
        }}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
