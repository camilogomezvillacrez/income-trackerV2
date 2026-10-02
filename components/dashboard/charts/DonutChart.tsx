"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { ChevronRight } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import CategoryIcon from "@/components/common/CategoryIcon";
import { findCategory } from "@/lib/categoryMeta";
import { fmt } from "@/lib/utils";

/*
 * Dona grande con el total gastado al centro y, debajo, la lista de
 * categorías (punto, ícono, nombre, monto). Tocar un trozo o una fila abre
 * esa categoría.
 */
export default function DonutChart() {
  const data = useDashboardStore((s) => s.data);
  const setView = useDashboardStore((s) => s.setView);
  if (!data?.by_category.length) {
    return (
      <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "20px 0" }}>
        Sin gastos este mes
      </div>
    );
  }

  const rows = data.by_category.map((c) => {
    const meta = findCategory(data, c.category, "gasto");
    return { cat: c.category, value: c.total, color: meta.color, icon: meta.icon };
  });
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <div style={{ position: "relative", width: "100%", maxWidth: "260px", aspectRatio: "1", margin: "4px auto 20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="value"
              nameKey="cat"
              innerRadius="60%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
              onClick={(entry) => {
                const cat = (entry as unknown as { cat?: string })?.cat;
                if (cat) setView(`cat-${cat}`);
              }}
              style={{ cursor: "pointer", outline: "none" }}
            >
              {rows.map((r) => (
                <Cell key={r.cat} fill={r.color} stroke="var(--white)" strokeWidth={3} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <span style={{ fontSize: total >= 10_000_000 ? "19px" : "22px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            {fmt(total)}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>gastado</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {rows.map((r) => (
          <button
            key={r.cat}
            onClick={() => setView(`cat-${r.cat}`)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              padding: "10px 12px",
              background: "var(--white)",
              border: "1px solid var(--hair)",
              borderRadius: "12px",
              boxShadow: "0 1px 2px rgba(16,24,40,.04)",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              textAlign: "left",
            }}
          >
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
            <CategoryIcon icon={r.icon} color={r.color} size={26} />
            <span style={{ flex: 1, minWidth: 0, fontSize: "14px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.cat}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
              {fmt(r.value)}
            </span>
            <ChevronRight size={15} color="var(--muted)" style={{ opacity: 0.5, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}
