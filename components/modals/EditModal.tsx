"use client";

import { useState, useEffect } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import PaymentPicker from "@/components/payments/PaymentPicker";
import { CategoryGrid, SubcatGrid } from "@/components/categories/CategoryGrids";
import { categoriesOf, findCategory, frequentCategories } from "@/lib/categoryMeta";
import { defaultPayment } from "@/lib/paymentMeta";
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
  const [pm, setPm]       = useState(movement?.payment_method ?? defaultPayment(data));

  useEffect(() => {
    if (movement) {
      setCat(movement.category);
      setSubcat(movement.subcategory);
      setAmount(fmtMiles(movement.amount));
      setDate(movement.date);
      setNote(movement.note ?? "");
      setPm(movement.payment_method ?? defaultPayment(data));
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

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        aria-label="Fecha"
        className="date-chip"
      />

      <CategoryGrid
        categories={categories}
        selected={cat}
        onSelect={(c, sub) => { setCat(c); setSubcat(sub ?? null); }}
        frequent={frequentCategories(data, tipo, 8, cat)}
      />
      {tipo === "gasto" && subs.length > 0 && (
        <SubcatGrid subs={subs} selected={subcat} onSelect={setSubcat} />
      )}
      <div style={{ marginBottom: "10px" }}>
        <label style={labelStyle}>Descripción</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </div>
      {tipo === "gasto" && <PaymentPicker value={pm} onChange={setPm} />}
    </ModalBase>
  );
}
