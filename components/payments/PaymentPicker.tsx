"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { paymentsOf } from "@/lib/paymentMeta";

interface Props {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}

/**
 * Selector de "Pagado con" con los medios del usuario. En 2 columnas: con
 * nombres largos ("American Express") una sola fila partía en el móvil.
 */
export default function PaymentPicker({ value, onChange, label = "Pagado con" }: Props) {
  const data = useDashboardStore((s) => s.data);
  const methods = paymentsOf(data);

  return (
    <div style={{ marginBottom: "14px" }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
        {methods.map((m) => {
          const on = value === m.name;
          return (
            <button
              key={m.id}
              onClick={() => onChange(m.name)}
              style={{
                padding: "8px 6px",
                border: `1.5px solid ${on ? "var(--text)" : "var(--border)"}`,
                borderRadius: "8px",
                background: on ? "#EEF2FF" : "var(--bg)",
                fontSize: "11px",
                fontWeight: 600,
                color: on ? "var(--text)" : "var(--sub)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                textAlign: "center",
                transition: "all 0.15s",
              }}
            >
              {m.emoji} {m.name}
              {m.last4 && <span style={{ opacity: 0.6 }}> ••{m.last4}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "5px",
};
