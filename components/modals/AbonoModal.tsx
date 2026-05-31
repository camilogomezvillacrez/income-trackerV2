"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";

export default function AbonoModal() {
  const { abonoTarget, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);
  const [amount, setAmount] = useState("");

  async function submit() {
    if (!amount || !abonoTarget) { alert("Ingresa un monto"); return; }
    await fetch(`/api/goal/${abonoTarget.goalId}/abono`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(amount) }),
    });
    closeModal();
    toast("💰 Abono registrado");
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
    marginBottom: "10px",
  };

  return (
    <ModalBase title="Abonar a meta">
      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inp} placeholder="Monto a abonar" autoFocus />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button onClick={closeModal} style={{ flex: 1, background: "none", color: "var(--sub)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Cancelar
        </button>
        <button onClick={submit} style={{ flex: 1, background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          Abonar
        </button>
      </div>
    </ModalBase>
  );
}
