"use client";

import { BarChart, Bar, XAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function WeeklyChart() {
  const data = useDashboardStore((s) => s.data);
  if (!data) return null;

  const weekly = data.weekly ?? {};
  const vals = DAYS.map((_, i) => weekly[String(i)] ?? 0);
  const max = Math.max(...vals);

  const chartData = DAYS.map((day, i) => ({ day, total: vals[i] }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(0,0,0,.03)" }}
          formatter={(v) => [fmt(Number(v ?? 0)), "Gasto"]}
          contentStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(16,24,40,.12)" }}
        />
        {/* Barra de fondo gris a tope y la del dia encima: se lee como un medidor */}
        <Bar
          dataKey="total"
          radius={[6, 6, 6, 6]}
          maxBarSize={22}
          background={{ fill: "#F1F3F5", radius: 6 }}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.total === max && max > 0 ? "#DC2626" : "#6366F1"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
