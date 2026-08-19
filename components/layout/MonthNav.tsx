"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { currentMonth, monthLabel } from "@/lib/utils";

function addMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const arrowBtn: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--sub)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "38px",
  height: "38px",
  borderRadius: "50%",
  lineHeight: 1,
  flexShrink: 0,
};

export default function MonthNav() {
  const { activeMonth, setMonth, data } = useDashboardStore();

  const isCurrentMonth = activeMonth >= currentMonth();

  // Meses disponibles para el desplegable (los que tienen datos + el actual)
  const months = data?.all_months?.length
    ? data.all_months
    : [currentMonth()];
  const options = months.includes(activeMonth)
    ? months
    : [activeMonth, ...months];

  function navigate(dir: -1 | 1) {
    const next = addMonth(activeMonth, dir);
    if (dir === 1 && next > currentMonth()) return; // no ir al futuro
    setMonth(next);
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: "21px",
        padding: "2px",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{ ...arrowBtn, cursor: "pointer" }}
        aria-label="Mes anterior"
      >
        <ChevronLeft size={19} />
      </button>

      {/* Selector: al tocar el mes se abre la lista de meses */}
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
        <select
          value={activeMonth}
          onChange={(e) => setMonth(e.target.value)}
          aria-label="Elegir mes"
          style={{
            appearance: "none",
            WebkitAppearance: "none",
            MozAppearance: "none",
            background: "transparent",
            border: "none",
            fontSize: "13.5px",
            fontWeight: 600,
            color: "var(--text)",
            fontFamily: "var(--font-sans)",
            padding: "9px 20px 9px 6px",
            cursor: "pointer",
            textAlign: "center",
            outline: "none",
            minWidth: "96px",
          }}
        >
          {options.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          color="var(--muted)"
          style={{ position: "absolute", right: "5px", pointerEvents: "none" }}
        />
      </div>

      <button
        onClick={() => navigate(1)}
        disabled={isCurrentMonth}
        style={{
          ...arrowBtn,
          cursor: isCurrentMonth ? "default" : "pointer",
          opacity: isCurrentMonth ? 0.3 : 1,
        }}
        aria-label="Mes siguiente"
      >
        <ChevronRight size={19} />
      </button>
    </div>
  );
}
