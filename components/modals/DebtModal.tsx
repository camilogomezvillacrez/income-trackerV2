"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { todayDate } from "@/lib/utils";

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

export default function DebtModal() {
  const { data, editDebtId, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const editing = data?.debts.find((d) => d.id === editDebtId) ?? null;

  const [type, setType] = useState<"debo" | "me_deben">(editing?.type ?? "debo");
  const [person, setPerson] = useState(editing?.person ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [date, setDate] = useState(editing?.date ?? todayDate());
  const [dueDate, setDueDate] = useState(editing?.due_date ?? "");
  const [paid, setPaid] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nombres ya usados, para autocompletar
  const personas = Array.from(new Set((data?.debts ?? []).map((d) => d.person))).sort();

  async function submit() {
    const monto = parseFloat(amount);
    if (!person.trim()) { setError("Escribe el nombre de la persona"); return; }
    if (!monto || monto <= 0) { setError("El monto debe ser mayor a cero"); return; }

    setSaving(true);
    setError("");

    const body = {
      person: person.trim(),
      type,
      amount: monto,
      description: description.trim() || null,
      date,
      due_date: dueDate || null,
      ...(editing ? {} : { paid: parseFloat(paid) || 0 }),
    };

    const res = await fetch(editing ? `/api/debt/${editing.id}` : "/api/debt", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo guardar");
      return;
    }

    closeModal();
    toast(editing ? "Deuda actualizada" : "🤝 Deuda anotada");
    refresh();
  }

  const tab = (active: boolean, color: string): React.CSSProperties => ({
    flex: 1,
    padding: "10px",
    fontSize: "12.5px",
    fontWeight: 600,
    borderRadius: "8px",
    border: `1px solid ${active ? color : "var(--border)"}`,
    background: active ? color : "var(--white)",
    color: active ? "#fff" : "var(--sub)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
  });

  return (
    <ModalBase title={editing ? "Editar deuda" : "Nueva deuda"}>
      {/* Tipo */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button onClick={() => setType("debo")} style={tab(type === "debo", "var(--red)")}>
          💸 Yo debo
        </button>
        <button onClick={() => setType("me_deben")} style={tab(type === "me_deben", "var(--green)")}>
          🤝 Me deben
        </button>
      </div>

      <label style={label}>Persona</label>
      <input
        list="personas-deudas"
        value={person}
        onChange={(e) => setPerson(e.target.value)}
        style={inp}
        placeholder="Nombre de la persona"
        autoFocus
      />
      <datalist id="personas-deudas">
        {personas.map((p) => <option key={p} value={p} />)}
      </datalist>

      <label style={label}>Monto total</label>
      <input
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={inp}
        placeholder="0"
      />

      {!editing && (
        <>
          <label style={label}>Ya abonado (opcional)</label>
          <input
            type="number"
            inputMode="decimal"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
            style={inp}
            placeholder="0"
          />
        </>
      )}

      <label style={label}>Descripción (opcional)</label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        style={inp}
        placeholder="Ej: préstamo para el carro"
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inp} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Vence (opcional)</label>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inp} />
        </div>
      </div>

      {error && (
        <p style={{ fontSize: "12px", color: "var(--red)", marginTop: "12px" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: "8px", marginTop: "18px" }}>
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
          onClick={submit}
          disabled={saving}
          style={{
            flex: 1,
            background: "var(--text)",
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
          {saving ? "Guardando…" : editing ? "Guardar" : "Anotar deuda"}
        </button>
      </div>
    </ModalBase>
  );
}
