"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";
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
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.04)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 9, fill: "#4B5563", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 9, fill: "#4B5563", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v ? "$" + Math.round(v / 1000) + "k" : ""}
        />
        <Tooltip
          formatter={(v) => [fmt(Number(v ?? 0)), "Gasto"]}
          contentStyle={{ fontSize: 11, fontFamily: "Inter", borderRadius: 8, border: "1px solid #E2E4E9" }}
        />
        <Bar dataKey="total" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.total === max && max > 0 ? "rgba(153,27,27,.6)" : "#E5E7EB"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
