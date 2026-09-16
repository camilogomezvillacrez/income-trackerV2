"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import MoneyInput from "@/components/common/MoneyInput";
import { parseMiles } from "@/lib/utils";

export default function GoalModal() {
  const { closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);
  const [emoji, setEmoji] = useState("🎯");
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");

  const inp = (style?: React.CSSProperties): React.CSSProperties => ({
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
    ...style,
  });

  async function submit() {
    if (!name || !target) { alert("Completa nombre y objetivo"); return; }
    await fetch("/api/goal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, target: parseMiles(target), saved: parseMiles(saved), emoji }),
    });
    closeModal();
    toast("🎯 Meta creada");
    refresh();
  }

  return (
    <ModalBase title="Nueva meta de ahorro">
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={emoji} onChange={(e) => setEmoji(e.target.value)} style={{ ...inp(), width: "60px", flexShrink: 0 }} placeholder="🎯" />
        <input value={name} onChange={(e) => setName(e.target.value)} style={inp()} placeholder="Nombre de la meta" />
      </div>
      <MoneyInput value={target} onChange={setTarget} style={inp()} placeholder="Monto objetivo" />
      <MoneyInput value={saved} onChange={setSaved} style={inp()} placeholder="Ya tengo ahorrado (opcional)" />
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button
          onClick={closeModal}
          style={{ flex: 1, background: "none", color: "var(--sub)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          style={{ flex: 1, background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          Crear meta
        </button>
      </div>
    </ModalBase>
  );
}
