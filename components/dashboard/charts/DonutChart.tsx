"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { CAT_META } from "@/constants/categories";
import { fmt } from "@/lib/utils";

export default function DonutChart() {
  const data = useDashboardStore((s) => s.data);
  const setView = useDashboardStore((s) => s.setView);
  if (!data?.by_category.length) return null;

  const cats = data.by_category.slice(0, 7);
  const chartData = cats.map((c) => ({
    name: `${CAT_META[c.category]?.emoji ?? ""} ${c.category}`,
    // El nombre lleva emoji para la leyenda; se guarda el crudo para navegar.
    cat: c.category,
    value: c.total,
    color: CAT_META[c.category]?.color ?? "#6B7280",
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="45%"
          innerRadius="55%"
          outerRadius="75%"
          dataKey="value"
          stroke="none"
          // Categorias salio de la barra de abajo: se entra tocando aqui.
          onClick={(entry) => {
            const cat = (entry as unknown as { cat?: string })?.cat;
            if (cat) setView(`cat-${cat}`);
          }}
          style={{ cursor: "pointer", outline: "none" }}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color + "CC"} stroke={entry.color} strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v) => [fmt(Number(v ?? 0))]}
          contentStyle={{ fontSize: 11, fontFamily: "Inter", borderRadius: 8, border: "1px solid #E2E4E9" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 9, fontFamily: "Inter", paddingTop: "4px" }}
          iconSize={8}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
