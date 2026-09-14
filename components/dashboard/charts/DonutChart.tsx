"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { findCategory } from "@/lib/categoryMeta";
import { fmt } from "@/lib/utils";

export default function DonutChart() {
  const data = useDashboardStore((s) => s.data);
  const setView = useDashboardStore((s) => s.setView);
  if (!data?.by_category.length) return null;

  const cats = data.by_category.slice(0, 7);
  const chartData = cats.map((c) => {
    const meta = findCategory(data, c.category, "gasto");
    const emoji = meta.icon.startsWith("emoji:") ? `${meta.icon.slice(6)} ` : "";
    return {
      // La leyenda lleva el emoji si la categoría usa uno; se guarda el crudo para navegar.
      name: `${emoji}${c.category}`,
      cat: c.category,
      value: c.total,
      color: meta.color,
    };
  });

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
