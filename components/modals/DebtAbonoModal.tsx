"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { todayDate, fmt } from "@/lib/utils";

export default function DebtAbonoModal() {
  const { data, debtTarget, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const debt = data?.debts.find((d) => d.id === debtTarget) ?? null;

  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDate());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!debt) return null;

  const esMia = debt.type === "debo";
  const color = esMia ? "var(--red)" : "var(--green)";

  async function enviar(saldar: boolean) {
    if (!debt) return;
    if (!saldar) {
      const monto = parseFloat(amount);
      if (!monto || monto <= 0) { setError("Ingresa un monto mayor a cero"); return; }
    }

    setSaving(true);
    setError("");

    const res = await fetch(`/api/debt/${debt.id}/abono`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        saldar ? { saldar: true, date } : { amount: parseFloat(amount), date }
      ),
    });

    setSaving(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo registrar");
      return;
    }

    const j = await res.json().catch(() => ({}));
    closeModal();
    toast(j.completed ? "✓ Deuda saldada" : "💰 Abono registrado");
    refresh();
  }

  const inp: React.CSSProperties = {
    width: "100%",
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 12px",
    fontSize: "13px",
    fontFamily: "var(--font-sans)",
    color: "var(--text)",
    outline: "none",
  };

  const label: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 600,
    color: "var(--muted)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: "5px",
    marginTop: "12px",
  };

  return (
    <ModalBase title={esMia ? "Pagar deuda" : "Registrar abono"}>
      {/* Resumen de la deuda */}
      <div style={{ background: "var(--bg)", borderRadius: "9px", padding: "12px 14px", marginBottom: "4px" }}>
        <div style={{ fontSize: "12px", color: "var(--sub)", marginBottom: "3px" }}>
          {esMia ? "Le debes a" : "Te debe"} <strong>{debt.person}</strong>
        </div>
        <div style={{ fontSize: "18px", fontWeight: 700, color, fontFamily: "var(--font-mono)" }}>
          {fmt(debt.pending)}
        </div>
        {debt.paid > 0 && (
          <div style={{ fontSize: "11px", color: "var(--muted)", marginTop: "2px" }}>
            Ya van {fmt(debt.paid)} de {fmt(debt.amount)}
          </div>
        )}
      </div>

      <label style={label}>Monto del abono</label>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={inp}
        placeholder={`Máximo ${fmt(debt.pending)}`}
        autoFocus
      />

      <label style={label}>Fecha</label>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />

      {error && <p style={{ fontSize: "12px", color: "var(--red)", marginTop: "12px" }}>{error}</p>}

      <button
        onClick={() => enviar(true)}
        disabled={saving}
        style={{
          width: "100%",
          marginTop: "14px",
          background: "none",
          border: `1px solid ${color}`,
          color,
          borderRadius: "8px",
          padding: "10px",
          fontSize: "12.5px",
          fontWeight: 600,
          cursor: saving ? "default" : "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        Saldar completa ({fmt(debt.pending)})
      </button>

      <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
        <button
          onClick={closeModal}
          style={{
            flex: 1,
            background: "none",
            color: "var(--sub)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "11px",
            fontSize: "13px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
          }}
        >
          Cancelar
        </button>
        <button
          onClick={() => enviar(false)}
          disabled={saving}
          style={{
            flex: 1,
            background: color,
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "11px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: saving ? "default" : "pointer",
            opacity: saving ? 0.7 : 1,
            fontFamily: "var(--font-sans)",
          }}
        >
          {saving ? "Guardando…" : "Registrar"}
        </button>
      </div>
    </ModalBase>
  );
}
