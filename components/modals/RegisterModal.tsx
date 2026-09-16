"use client";

import { useState } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { PAYMENT_METHODS, PAYMENT_META, type PaymentMethod } from "@/constants/categories";
import { CategoryGrid, SubcatGrid } from "@/components/categories/CategoryGrids";
import { categoriesOf, findCategory } from "@/lib/categoryMeta";
import { todayDate, parseMiles } from "@/lib/utils";
import AmountHero from "@/components/common/AmountHero";
import type { MovementType } from "@/types";

export default function RegisterModal() {
  const { closeModal, refresh, data } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const [tipo, setTipo] = useState<MovementType>("ingreso");
  const [cat, setCat] = useState<string | null>(null);
  const [subcat, setSubcat] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayDate());
  const [note, setNote] = useState("");
  const [pm, setPm] = useState<PaymentMethod>("Efectivo");

  function changeTipo(t: MovementType) {
    setTipo(t);
    setCat(null);
    setSubcat(null);
  }

  function selectCat(name: string) {
    setCat(name);
    setSubcat(null);
  }

  async function submit() {
    if (!amount) { alert("Ingresa un monto"); return; }
    if (!cat) { alert("Selecciona una categoría"); return; }
    const url = tipo === "ingreso" ? "/api/income" : "/api/expense";
    const payload: Record<string, unknown> = { amount: parseMiles(amount), category: cat, subcategory: subcat, note, date };
    if (tipo === "gasto") payload.payment_method = pm;
    await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    closeModal();
    toast(tipo === "ingreso" ? "💰 Ingreso guardado" : "💸 Gasto guardado");
    refresh();
  }

  const categories = categoriesOf(data, tipo);
  const subs = cat ? findCategory(data, cat, tipo).subs : [];

  return (
    <ModalBase
      title={tipo === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto"}
      footer={
        <>
          <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
          <button onClick={submit} style={btnPrimary}>Guardar</button>
        </>
      }
    >
      {/* Tipo toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {(["ingreso", "gasto"] as MovementType[]).map((t) => {
          const active = tipo === t;
          return (
            <button
              key={t}
              onClick={() => changeTipo(t)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                padding: "10px",
                border: `2px solid ${active ? (t === "ingreso" ? "var(--green)" : "var(--red)") : "var(--border)"}`,
                borderRadius: "10px",
                cursor: "pointer",
                background: active ? (t === "ingreso" ? "var(--green-bg)" : "var(--red-bg)") : "var(--bg)",
                fontFamily: "var(--font-sans)",
                fontSize: "13px",
                fontWeight: 600,
                color: active ? (t === "ingreso" ? "var(--green)" : "var(--red)") : "var(--muted)",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "18px" }}>{t === "ingreso" ? "💰" : "💸"}</span>
              {t === "ingreso" ? "Ingreso" : "Gasto"}
            </button>
          );
        })}
      </div>

      <AmountHero
        value={amount}
        onChange={setAmount}
        color={tipo === "ingreso" ? "var(--green)" : "var(--red)"}
        autoFocus
      />

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Fecha"
        className="date-chip"
      />

      <CategoryGrid categories={categories} selected={cat} onSelect={selectCat} />

      {tipo === "gasto" && subs.length > 0 && (
        <SubcatGrid subs={subs} selected={subcat} onSelect={setSubcat} />
      )}

      {/* Note */}
      <div style={{ marginBottom: "10px" }}>
        <label style={labelStyle}>Descripción</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: almuerzo con cliente" style={inputStyle} />
      </div>

      {/* Payment method (gastos only) */}
      {tipo === "gasto" && (
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Pagado con</label>
          {/* 2×2: con 4 métodos en fila, "American Express" partía en dos líneas en el móvil */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {PAYMENT_METHODS.map((method) => (
              <button
                key={method}
                onClick={() => setPm(method)}
                style={{
                  flex: 1,
                  padding: "8px 6px",
                  border: `1.5px solid ${pm === method ? "var(--text)" : "var(--border)"}`,
                  borderRadius: "8px",
                  background: pm === method ? "#EEF2FF" : "var(--bg)",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: pm === method ? "var(--text)" : "var(--sub)",
                  cursor: "pointer",
                  fontFamily: "var(--font-sans)",
                  textAlign: "center",
                  transition: "all 0.15s",
                }}
              >
                {PAYMENT_META[method].emoji} {method}
              </button>
            ))}
          </div>
        </div>
      )}

    </ModalBase>
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

const inputStyle: React.CSSProperties = {
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

const btnPrimary: React.CSSProperties = {
  flex: 1,
  background: "var(--text)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "13px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const btnSecondary: React.CSSProperties = {
  flex: 1,
  background: "none",
  color: "var(--sub)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "10px",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
