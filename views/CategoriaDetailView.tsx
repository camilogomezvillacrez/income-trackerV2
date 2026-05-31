"use client";

import { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { CAT_META } from "@/constants/categories";
import { fmt } from "@/lib/utils";
import TransactionRow from "@/components/transactions/TransactionRow";

interface Props { catName: string; }

export default function CategoriaDetailView({ catName }: Props) {
  const { data, setView, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);
  const [showBudgetEdit, setShowBudgetEdit] = useState(false);
  const [budgetInput, setBudgetInput]       = useState("");
  const [activeSubcat, setActiveSubcat]     = useState<string | null>(null);

  if (!data) return null;

  const meta   = CAT_META[catName] ?? { emoji: "", color: "#6B7280", bg: "#F3F4F6" };
  const cat    = data.by_category.find((c) => c.category === catName);
  const budget = data.budgets[catName];
  const over   = budget && cat && cat.total > budget;

  // All gasto rows for this category, optionally filtered by subcategory
  const allRows = (data.all_movs ?? []).filter((r) => r.category === catName && r.tipo === "gasto");
  const rows    = activeSubcat ? allRows.filter((r) => r.subcategory === activeSubcat) : allRows;

  async function saveBudget() {
    const amount = parseFloat(budgetInput);
    if (!amount || isNaN(amount)) { toast("Monto inválido", "err"); return; }
    await fetch(`/api/budget/${encodeURIComponent(catName)}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    });
    toast(`Presupuesto de ${catName} guardado`);
    setShowBudgetEdit(false);
    refresh();
  }

  async function deleteBudget() {
    await fetch(`/api/budget/${encodeURIComponent(catName)}`, { method: "DELETE" });
    toast("Presupuesto eliminado");
    setShowBudgetEdit(false);
    refresh();
  }

  return (
    <div>
      <button
        onClick={() => setView("cats")}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "#4A7C59", color: "#fff", border: "none", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "13px", fontWeight: 600, fontFamily: "var(--font-sans)", marginBottom: "12px" }}
      >
        <ArrowLeft size={15} /> Volver a Categorías
      </button>

      <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "14px" }}>
          {meta.emoji} {catName}
        </p>

        {/* Total + budget */}
        <div style={{ marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "var(--red)", fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums" }}>
            {cat ? fmt(cat.total) : "$0"}
          </span>
          <span style={{ fontSize: "12px", color: "var(--muted)", marginLeft: "6px" }}>este mes</span>
          {budget && cat && (
            <span style={{ fontSize: "11px", fontWeight: 600, color: over ? "var(--red)" : "var(--green)", marginLeft: "8px" }}>
              {over ? "⚠ Superado" : "✓ Dentro del presupuesto"} · {fmt(budget)}
            </span>
          )}
          <br />
          <button
            onClick={() => { setShowBudgetEdit(!showBudgetEdit); setBudgetInput(String(budget ?? "")); }}
            style={{ background: "none", border: "1px dashed var(--border)", color: "var(--muted)", fontSize: "10px", padding: "4px 10px", borderRadius: "6px", cursor: "pointer", fontFamily: "var(--font-sans)", marginTop: "8px" }}
          >
            {budget ? "✏ Editar presupuesto" : "+ Definir presupuesto"}
          </button>

          {showBudgetEdit && (
            <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
              <input
                type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Ej: 500000"
                style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", fontFamily: "var(--font-sans)", color: "var(--text)", outline: "none" }}
              />
              <button onClick={saveBudget} style={{ background: "var(--text)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>Guardar</button>
              {budget && <button onClick={deleteBudget} style={{ background: "var(--red)", color: "#fff", border: "none", borderRadius: "6px", padding: "6px 12px", fontSize: "11px", cursor: "pointer", fontFamily: "var(--font-sans)" }}>✕</button>}
            </div>
          )}
        </div>

        {/* Subcategories — clickable to filter */}
        {cat && cat.subs.length > 0 && (
          <>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>
              Por subcategoría <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "var(--muted)", fontSize: "10px" }}>(toca para filtrar)</span>
            </p>
            {cat.subs.map((s) => {
              const pct     = Math.round((s.total / cat.total) * 100);
              const isActive = activeSubcat === s.name;
              return (
                <div
                  key={s.name}
                  onClick={() => setActiveSubcat(isActive ? null : s.name)}
                  style={{
                    marginBottom: "10px", cursor: "pointer", padding: "8px", borderRadius: "8px",
                    background: isActive ? `${meta.color}14` : "transparent",
                    border: `1px solid ${isActive ? meta.color : "transparent"}`,
                    transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text)", fontWeight: isActive ? 600 : 500 }}>{s.name}</span>
                    <span style={{ fontSize: "11px", color: "var(--muted)" }}>{pct}% · {fmt(s.total)}</span>
                  </div>
                  <div style={{ height: "5px", background: "var(--bg)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: "3px", width: `${pct}%`, background: meta.color, opacity: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Active filter chip */}
        {activeSubcat && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}50`, borderRadius: "20px", padding: "4px 12px", fontSize: "11px", fontWeight: 600, margin: "8px 0 12px", cursor: "pointer" }}
               onClick={() => setActiveSubcat(null)}>
            {activeSubcat} <X size={12} />
          </div>
        )}

        {/* Transactions */}
        {rows.length > 0 && (
          <>
            <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", margin: "14px 0 10px" }}>
              Registros {activeSubcat ? `· ${activeSubcat}` : ""}
            </p>
            {rows.map((r) => <TransactionRow key={`${r.tipo}-${r.id}`} r={r} />)}
          </>
        )}

        {!cat && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "20px 0" }}>
            Sin gastos en esta categoría este mes
          </div>
        )}
        {cat && rows.length === 0 && activeSubcat && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "20px 0" }}>
            Sin registros en {activeSubcat} este mes
          </div>
        )}
      </div>
    </div>
  );
}
