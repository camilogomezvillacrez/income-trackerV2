"use client";

import { useEffect, useRef } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";

function countUp(el: HTMLElement, target: number, duration = 700) {
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt(Math.round(target * ease));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function countUpPct(el: HTMLElement, target: number, duration = 700) {
  const start = performance.now();
  const step = (now: number) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * ease).toFixed(1) + "%";
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

interface KPICardProps {
  label: string;
  value: number;
  borderColor: string;
  valueColor: string;
  emoji: string;
  sub?: string;
  subColor?: string;
  isPct?: boolean;
}

function KPICard({ label, value, borderColor, valueColor, emoji, sub, subColor, isPct }: KPICardProps) {
  const valRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!valRef.current) return;
    if (isPct) countUpPct(valRef.current, value);
    else countUp(valRef.current, Math.abs(value));
  }, [value]);

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: "0 10px 10px 0",
        padding: "14px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontSize: "10px", color: "var(--muted)", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "22px", lineHeight: 1 }}>{emoji}</span>
      </div>
      <div
        ref={valRef}
        style={{
          fontSize: "18px",
          fontWeight: 600,
          color: valueColor,
          fontFamily: "var(--font-mono)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isPct ? "0.0%" : "$0"}
      </div>
      {sub && (
        <div style={{ fontSize: "10px", color: subColor ?? "var(--muted)", marginTop: "2px" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function KPICards() {
  const data = useDashboardStore((s) => s.data);
  const loading = useDashboardStore((s) => s.loading);

  if (loading || !data) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "10px", marginBottom: "16px" }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="sk" style={{ height: "92px", borderRadius: "10px" }} />
        ))}
      </div>
    );
  }

  const { month_inc, month_exp, balance, tasa_ahorro, current_month } = data;
  const tasaOk = tasa_ahorro >= 20;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, minmax(0,1fr))",
        gap: "10px",
        marginBottom: "16px",
      }}
      className="kpi-grid"
    >
      <KPICard
        label={`Ingresos ${current_month}`}
        value={month_inc}
        borderColor="var(--green)"
        valueColor="var(--green)"
        emoji="💰"
      />
      <KPICard
        label={`Gastos ${current_month}`}
        value={month_exp}
        borderColor="var(--red)"
        valueColor="var(--red)"
        emoji="💸"
      />
      <KPICard
        label="Balance"
        value={balance}
        borderColor="var(--blue)"
        valueColor={balance >= 0 ? "var(--green)" : "var(--red)"}
        emoji={balance >= 0 ? "⚖️" : "🔴"}
        sub={balance >= 0 ? "✓ positivo" : "⚠ negativo"}
      />
      <KPICard
        label="Tasa ahorro"
        value={tasa_ahorro}
        borderColor="var(--purple)"
        valueColor="var(--purple)"
        emoji={tasaOk ? "🚀" : "📉"}
        sub={tasaOk ? "✓ meta cumplida" : "meta: 20%"}
        subColor={tasaOk ? "var(--green)" : "var(--amber)"}
        isPct
      />

      <style>{`
        @media (max-width: 768px) {
          .kpi-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}
