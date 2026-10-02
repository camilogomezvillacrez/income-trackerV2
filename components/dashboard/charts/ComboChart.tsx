"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

const SERIES = [
  { key: "Ingresos", color: "#10B981" },
  { key: "Gastos", color: "#DC2626" },
  { key: "Balance", color: "#6366F1" },
] as const;

export default function ComboChart() {
  const data = useDashboardStore((s) => s.data);
  if (!data?.monthly.length) return null;

  const chartData = data.monthly.map((r) => ({
    month: r.month,
    Ingresos: r.ingresos,
    Gastos: r.gastos,
    Balance: r.ingresos - r.gastos,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "var(--muted)", fontFamily: "var(--font-sans)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,.03)" }}
              formatter={(v, name) => [fmt(Number(v ?? 0)), String(name)]}
              contentStyle={{ fontSize: 12, fontFamily: "var(--font-sans)", borderRadius: 12, border: "none", boxShadow: "0 4px 16px rgba(16,24,40,.12)" }}
            />
            <Bar dataKey="Ingresos" fill={SERIES[0].color} radius={[6, 6, 6, 6]} maxBarSize={18} />
            <Bar dataKey="Gastos" fill={SERIES[1].color} radius={[6, 6, 6, 6]} maxBarSize={18} />
            <Line
              type="monotone"
              dataKey="Balance"
              stroke={SERIES[2].color}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: "var(--white)", stroke: SERIES[2].color, strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", paddingTop: "10px" }}>
        {SERIES.map((s) => (
          <span key={s.key} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--sub)" }}>
            <span style={{ width: 9, height: 9, borderRadius: "50%", background: s.color }} />
            {s.key}
          </span>
        ))}
      </div>
    </div>
  );
}
