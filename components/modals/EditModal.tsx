"use client";

import { useState, useEffect } from "react";
import ModalBase from "./ModalBase";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { CAT_META, EXP_CATS, INC_CATS, SUBCATS, SUBCAT_EMOJIS, PAYMENT_METHODS, type PaymentMethod } from "@/constants/categories";
import type { MovementType } from "@/types";

function CategoryGrid({ cats, selected, onSelect }: { cats: readonly string[]; selected: string | null; onSelect: (c: string) => void }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
        Categoría
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
        {cats.map((name) => {
          const m = CAT_META[name] ?? { emoji: "⚪", color: "#6B7280", bg: "#F3F4F6" };
          const active = selected === name;
          return (
            <button key={name} onClick={() => onSelect(name)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", padding: "10px 4px 8px", border: `2px solid ${active ? m.color : "var(--border)"}`, borderRadius: "10px", cursor: "pointer", background: active ? m.bg : "var(--bg)", fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>
              <span style={{ fontSize: "22px", lineHeight: 1 }}>{m.emoji}</span>
              <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--sub)", textAlign: "center", lineHeight: 1.3 }}>{name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SubcatGrid({ subs, emojis, selected, onSelect }: { subs: string[]; emojis: Record<string, string>; selected: string | null; onSelect: (s: string) => void }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "8px" }}>
        Subcategoría <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
        {subs.map((s) => {
          const active = selected === s;
          return (
            <button key={s} onClick={() => onSelect(active ? "" : s)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", padding: "8px 4px 6px", border: `1.5px solid ${active ? "var(--text)" : "var(--border)"}`, borderRadius: "8px", cursor: "pointer", background: active ? "#EEF2FF" : "var(--bg)", fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>
              <span style={{ fontSize: "17px", lineHeight: 1 }}>{emojis[s] ?? "📌"}</span>
              <span style={{ fontSize: "9px", color: "var(--sub)", textAlign: "center", lineHeight: 1.2 }}>{s}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  const [amount, setAmount] = useState(String(movement?.amount ?? ""));
  const [date, setDate]   = useState(movement?.date ?? "");
  const [note, setNote]   = useState(movement?.note ?? "");
  const [pm, setPm]       = useState<PaymentMethod>((movement?.payment_method as PaymentMethod) ?? "Efectivo");

  useEffect(() => {
    if (movement) {
      setCat(movement.category);
      setSubcat(movement.subcategory);
      setAmount(String(movement.amount));
      setDate(movement.date);
      setNote(movement.note ?? "");
      setPm((movement.payment_method as PaymentMethod) ?? "Efectivo");
    }
  }, [editTarget]);

  if (!editTarget || !movement) return null;

  const tipo = movement.tipo as MovementType;
  const cats = tipo === "ingreso" ? INC_CATS : EXP_CATS;
  const subs = cat ? SUBCATS[cat] : null;
  const subEmojis = cat ? SUBCAT_EMOJIS[cat] ?? {} : {};

  async function submit() {
    if (!amount) { alert("Ingresa un monto"); return; }
    if (!cat) { alert("Selecciona una categoría"); return; }
    const url = tipo === "ingreso" ? `/api/income/${editTarget!.id}` : `/api/expense/${editTarget!.id}`;
    const payload: Record<string, unknown> = { amount: parseFloat(amount), category: cat, subcategory: subcat, note, date };
    if (tipo === "gasto") payload.payment_method = pm;
    await fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    closeModal();
    toast("✓ Movimiento actualizado");
    refresh();
  }

  return (
    <ModalBase title="Editar movimiento">
      <CategoryGrid cats={cats} selected={cat} onSelect={(c) => { setCat(c); setSubcat(null); }} />
      {subs && tipo === "gasto" && (
        <SubcatGrid subs={subs} emojis={subEmojis} selected={subcat} onSelect={setSubcat} />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
        <div>
          <label style={labelStyle}>Monto</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Fecha</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ marginBottom: "10px" }}>
        <label style={labelStyle}>Descripción</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} style={inputStyle} />
      </div>
      {tipo === "gasto" && (
        <div style={{ marginBottom: "14px" }}>
          <label style={labelStyle}>Pagado con</label>
          <div style={{ display: "flex", gap: "6px" }}>
            {PAYMENT_METHODS.map((method) => (
              <button key={method} onClick={() => setPm(method)} style={{ flex: 1, padding: "8px 6px", border: `1.5px solid ${pm === method ? "var(--text)" : "var(--border)"}`, borderRadius: "8px", background: pm === method ? "#EEF2FF" : "var(--bg)", fontSize: "11px", fontWeight: 600, color: pm === method ? "var(--text)" : "var(--sub)", cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "center", transition: "all 0.15s" }}>
                {method === "Efectivo" ? "💵" : method === "Visa Crédito" ? "💳" : "🟣"} {method}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
        <button onClick={closeModal} style={btnSecondary}>Cancelar</button>
        <button onClick={submit} style={btnPrimary}>Guardar cambios</button>
      </div>
    </ModalBase>
  );
}
