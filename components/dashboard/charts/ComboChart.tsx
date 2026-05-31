"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

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
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,.04)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 10, fill: "#4B5563", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#4B5563", fontFamily: "Inter" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => "$" + Math.round(v / 1000) + "k"}
        />
        <Tooltip
          formatter={(v, name) => [fmt(Number(v ?? 0)), String(name)]}
          contentStyle={{ fontSize: 11, fontFamily: "Inter", borderRadius: 8, border: "1px solid #E2E4E9" }}
        />
        <Legend
          wrapperStyle={{ fontSize: 10, fontFamily: "Inter" }}
          iconSize={10}
        />
        <Bar dataKey="Ingresos" fill="rgba(59,109,17,.18)" stroke="#3B6D11" strokeWidth={2} radius={[4,4,0,0]} />
        <Bar dataKey="Gastos"   fill="rgba(153,27,27,.18)"  stroke="#991B1B" strokeWidth={2} radius={[4,4,0,0]} />
        <Line
          type="monotone"
          dataKey="Balance"
          stroke="#1D4ED8"
          strokeWidth={2}
          dot={{ r: 3, fill: "#1D4ED8" }}
          fill="rgba(29,78,216,.08)"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
