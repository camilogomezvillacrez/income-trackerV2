"use client";

import { useState, useEffect } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { PAYMENT_METHODS, PAYMENT_META, type PaymentMethod } from "@/constants/categories";
import { CategoryGrid, SubcatGrid } from "@/components/categories/CategoryGrids";
import { categoriesOf, findCategory } from "@/lib/categoryMeta";
import AmountHero from "@/components/common/AmountHero";
import { fmtMiles, parseMiles } from "@/lib/utils";
import type { MovementType } from "@/types";

const labelStyle: React.CSSProperties = { display: "block", fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" };
const inputStyle: React.CSSProperties = { width: "100%", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px", fontSize: "13px", fontFamily: "var(--font-sans)", color: "var(--text)", outline: "none" };
const btnPrimary: React.CSSProperties = { flex: 1, background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "10px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--font-sans)" };
const btnSecondary: React.CSSProperties = { flex: 1, background: "none", color: "var(--sub)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px", fontSize: "13px", cursor: "pointer", fontFamily: "var(--font-sans)" };

export default function EditModal() {
  const { editTarget, data, closeModal, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const movement = data?.all_movs.find(
    (m) => m.id === editTarget?.id && m.tipo === editTarget?.tipo
  );

  const [cat, setCat]     = useState(movement?.category ?? null);
  const [subcat, setSubcat] = useState(movement?.subcategory ?? null);
  const [amount, setAmount] = useState(fmtMiles(movement?.amount ?? ""));
  const [date, setDate]   = useState(movement?.date ?? "");
  const [note, setNote]   = useState(movement?.note ?? "");
  const [pm, setPm]       = useState<PaymentMethod>((movement?.payment_method as PaymentMethod) ?? "Efectivo");

  useEffect(() => {
    if (movement) {
      setCat(movement.category);
      setSubcat(movement.subcategory);
      setAmount(fmtMiles(movement.amount));
      setDate(movement.date);
      setNote(movement.note ?? "");
      setPm((movement.payment_method as PaymentMethod) ?? "Efectivo");
    }
  }, [editTarget]);

  if (!editTarget || !movement) return null;

  const tipo = movement.tipo as MovementType;
  const categories = categoriesOf(data, tipo);
  const subs = cat ? findCategory(data, cat, tipo).subs : [];

  async function submit() {
    if (!amount) { alert("Ingresa un monto"); return; }
    if (!cat) { alert("Selecciona una categoría"); return; }
    const url = tipo === "ingreso" ? `/api/income/${editTarget!.id}` : `/api/expense/${editTarget!.id}`;
    const payload: Record<string, unknown> = { amount: parseMiles(amount), category: cat, subcategory: subcat, note, date };
    if (tipo === "gasto") payload.payment_method = pm;
    await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    closeModal();
    toast("✓ Movimiento actualizado");
    refresh();
  }

  return (
    <ModalBase
      title="Editar movimiento"
      footer={
        <>
          <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
          <button onClick={submit} style={btnPrimary}>Guardar cambios</button>
        </>
      }
    >
      <AmountHero
        value={amount}
        onChange={setAmount}
        color={tipo === "ingreso" ? "var(--green)" : "var(--red)"}
      />

      <div style={{ marginBottom: "18px" }}>
        <label style={labelStyle}>Fecha</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </div>

      <CategoryGrid categories={categories} selected={cat} onSelect={(c) => { setCat(c); setSubcat(null); }} />
      {tipo === "gasto" && subs.length > 0 && (
        <SubcatGrid subs={subs} selected={subcat} onSelect={setSubcat} />
      )}
      <div style={{ marginBottom: "10px" }}>
        <label style={labelStyle}>Descripción</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </div>
      {tipo === "gasto" && (
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Pagado con</label>
          {/* 2×2: con 4 métodos en fila, "American Express" partía en dos líneas en el móvil */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
            {PAYMENT_METHODS.map((method) => (
              <button key={method} onClick={() => setPm(method)} style={{ flex: 1, padding: "8px 6px", border: `1.5px solid ${pm === method ? "var(--text)" : "var(--border)"}`, borderRadius: "8px", background: pm === method ? "#EEF2FF" : "var(--bg)", fontSize: "11px", fontWeight: 600, color: pm === method ? "var(--text)" : "var(--sub)", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "center", transition: "all 0.15s" }}>
                {PAYMENT_META[method].emoji} {method}
              </button>
            ))}
          </div>
        </div>
      )}
    </ModalBase>
  );
}
