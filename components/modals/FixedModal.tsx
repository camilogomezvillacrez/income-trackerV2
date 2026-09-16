"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { categoriesOf, findCategory } from "@/lib/categoryMeta";
import { defaultPayment, paymentsOf } from "@/lib/paymentMeta";
import MoneyInput from "@/components/common/MoneyInput";
import { fmtMiles, parseMiles } from "@/lib/utils";

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

export default function FixedModal() {
  const { data, editDebtId, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  // Se reutiliza editDebtId como "id que se está editando" (null = nuevo)
  const editing = data?.fixed_expenses.find((f) => f.id === editDebtId) ?? null;

  const [name, setName] = useState(editing?.name ?? "");
  const [amount, setAmount] = useState(editing ? fmtMiles(editing.amount) : "");
  const [category, setCategory] = useState(editing?.category ?? categoriesOf(data, "gasto")[0]?.name ?? "General");
  const [subcategory, setSubcategory] = useState(editing?.subcategory ?? "");
  const [day, setDay] = useState(String(editing?.day_of_month ?? 1));
  const [method, setMethod] = useState(editing?.payment_method ?? defaultPayment(data));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const subs = findCategory(data, category, "gasto").subs.map((s) => s.name);
  const methods = paymentsOf(data);

  async function submit() {
    const monto = parseMiles(amount);
    if (!name.trim()) { setError("Ponle un nombre (ej: Arriendo)"); return; }
    if (!monto || monto <= 0) { setError("El monto debe ser mayor a cero"); return; }

    setSaving(true);
    setError("");

    const res = await fetch(editing ? `/api/fixed/${editing.id}` : "/api/fixed", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        amount: monto,
        category,
        subcategory: subcategory || null,
        day_of_month: parseInt(day, 10) || 1,
        payment_method: method,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "No se pudo guardar");
      return;
    }

    closeModal();
    toast(editing ? "Gasto fijo actualizado" : "🔄 Gasto fijo creado");
    refresh();
  }

  return (
    <ModalBase title={editing ? "Editar gasto fijo" : "Nuevo gasto fijo"}>
      <p style={{ fontSize: "12px", color: "var(--muted)", lineHeight: 1.6, marginBottom: "4px" }}>
        Se guarda como plantilla. Cada mes te aparece en el Resumen para que lo
        registres con un toque (y puedas corregir el monto si cambió).
      </p>

      <label style={label}>Nombre</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={inp}
        placeholder="Ej: Arriendo, Internet, Netflix"
        autoFocus
      />

      <div style={{ display: "flex", gap: "10px" }}>
        <div style={{ flex: 2 }}>
          <label style={label}>Monto habitual</label>
          <MoneyInput value={amount} onChange={setAmount} style={inp} placeholder="0" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Día del mes</label>
          <input
            type="number"
            min={1}
            max={31}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            style={inp}
          />
        </div>
      </div>

      <label style={label}>Categoría</label>
      <select
        value={category}
        onChange={(e) => { setCategory(e.target.value); setSubcategory(""); }}
        style={inp}
      >
        {categoriesOf(data, "gasto").map((c) => (
          <option key={c.name} value={c.name}>{c.name}</option>
        ))}
      </select>

      {subs.length > 0 && (
        <>
          <label style={label}>Subcategoría (opcional)</label>
          <select value={subcategory} onChange={(e) => setSubcategory(e.target.value)} style={inp}>
            <option value="">— Ninguna —</option>
            {subs.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </>
      )}

      <label style={label}>Método de pago</label>
      <select value={method} onChange={(e) => setMethod(e.target.value)} style={inp}>
        {methods.map((m) => (
          <option key={m.id} value={m.name}>{m.emoji} {m.name}{m.last4 ? ` ••${m.last4}` : ""}</option>
        ))}
      </select>

      {error && <p style={{ fontSize: "12px", color: "var(--red)", marginTop: "12px" }}>{error}</p>}

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
          {saving ? "Guardando…" : editing ? "Guardar" : "Crear"}
        </button>
      </div>
    </ModalBase>
  );
}
