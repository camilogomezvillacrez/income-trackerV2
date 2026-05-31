"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import TransactionRow from "@/components/transactions/TransactionRow";
import { useDashboardStore } from "@/store/dashboardStore";
import { exportCSV } from "@/lib/exportCSV";
import type { MovementType } from "@/types";

type TabType = "todos" | MovementType;

export default function MovimientosView() {
  const { data } = useDashboardStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<TabType>("todos");

  if (!data) return null;

  const q = query.toLowerCase().trim();
  let rows = data.all_movs ?? [];

  if (tab === "ingreso") rows = rows.filter((r) => r.tipo === "ingreso");
  if (tab === "gasto")   rows = rows.filter((r) => r.tipo === "gasto");
  if (q) {
    rows = rows.filter(
      (r) =>
        (r.note ?? "").toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.subcategory ?? "").toLowerCase().includes(q) ||
        String(r.amount).includes(q)
    );
  }

  const tabStyle = (t: TabType) => ({
    background: tab === t ? "var(--text)" : "none",
    color: tab === t ? "#fff" : "var(--muted)",
    border: `1px solid ${tab === t ? "var(--text)" : "var(--border)"}`,
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    transition: "all 0.15s",
  });

  return (
    <div
      style={{
        background: "var(--white)",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        padding: "16px",
      }}
    >
      {/* Search */}
      <div style={{ position: "relative", marginBottom: "12px" }}>
        <Search
          size={14}
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por descripción, categoría o monto..."
          style={{
            width: "100%",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "8px 12px 8px 32px",
            fontSize: "12px",
            fontFamily: "var(--font-sans)",
            color: "var(--text)",
            outline: "none",
          }}
        />
      </div>

      {/* Tabs + export */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={tabStyle("todos")}   onClick={() => setTab("todos")}>Todos</button>
          <button style={tabStyle("ingreso")} onClick={() => setTab("ingreso")}>Ingresos</button>
          <button style={tabStyle("gasto")}   onClick={() => setTab("gasto")}>Gastos</button>
        </div>
        <button
          onClick={() => exportCSV(data)}
          style={{
            background: "none",
            border: "1px solid var(--border)",
            color: "var(--muted)",
            fontSize: "11px",
            padding: "4px 10px",
            borderRadius: "6px",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            display: "flex",
            alignItems: "center",
            gap: "5px",
          }}
        >
          <Download size={12} /> CSV
        </button>
      </div>

      {/* List */}
      {rows.length === 0 ? (
        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "12px", padding: "30px 0" }}>
          {q ? `Sin resultados para "${q}"` : "Sin movimientos"}
        </div>
      ) : (
        rows.map((r) => <TransactionRow key={`${r.tipo}-${r.id}`} r={r} />)
      )}
    </div>
  );
}
