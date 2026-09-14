"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import TransactionRow from "@/components/transactions/TransactionRow";
import Money from "@/components/common/Money";
import { useDashboardStore } from "@/store/dashboardStore";
import { exportCSV } from "@/lib/exportCSV";
import type { Movement, MovTab } from "@/types";

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MONTHS   = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "Hoy", "Ayer" o "mié 30 sep" según la fecha del teléfono. */
function dayLabel(iso: string, today: Date) {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.round((base.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return `${WEEKDAYS[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** Los movimientos ya llegan ordenados por fecha descendente: se agrupan los consecutivos. */
function groupByDay(rows: Movement[]) {
  const groups: { date: string; items: Movement[]; total: number }[] = [];
  for (const r of rows) {
    const date = r.date.slice(0, 10);
    let g = groups[groups.length - 1];
    if (!g || g.date !== date) groups.push((g = { date, items: [], total: 0 }));
    g.items.push(r);
    g.total += r.tipo === "ingreso" ? r.amount : -r.amount;
  }
  return groups;
}

const TABS: { id: MovTab; label: string }[] = [
  { id: "todos",   label: "Todos" },
  { id: "ingreso", label: "Ingresos" },
  { id: "gasto",   label: "Gastos" },
];

export default function MovimientosView() {
  const { data, movTab, setMovTab } = useDashboardStore();
  const [query, setQuery] = useState("");
  const [today] = useState(() => new Date());

  if (!data) return null;

  const q = query.toLowerCase().trim();
  let rows = data.all_movs ?? [];

  if (movTab === "ingreso") rows = rows.filter((r) => r.tipo === "ingreso");
  if (movTab === "gasto")   rows = rows.filter((r) => r.tipo === "gasto");
  if (q) {
    rows = rows.filter(
      (r) =>
        (r.note ?? "").toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        (r.subcategory ?? "").toLowerCase().includes(q) ||
        String(r.amount).includes(q)
    );
  }

  const groups = groupByDay(rows);

  return (
    <div className="mov-view">
      <div className="mov-toolbar">
        <label className="mov-search">
          <Search size={15} aria-hidden />
          <input
            id="mov-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar movimiento"
            aria-label="Buscar por descripción, categoría o monto"
          />
        </label>

        <div className="mov-filters">
          <div className="mov-seg" role="tablist" aria-label="Tipo de movimiento">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={movTab === t.id}
                className={movTab === t.id ? "on" : ""}
                onClick={() => setMovTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="mov-csv" onClick={() => exportCSV(data)} aria-label="Exportar CSV del mes" title="Exportar CSV">
            <Download size={15} />
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mov-empty">{q ? `Sin resultados para "${query.trim()}"` : "Sin movimientos"}</div>
      ) : (
        groups.map((g) => (
          <section key={g.date} className="mov-day" aria-label={dayLabel(g.date, today)}>
            <div className="mov-day-head">
              <span>{dayLabel(g.date, today)}</span>
              <Money
                value={Math.abs(g.total)}
                prefix={g.total >= 0 ? "+" : "-"}
                color={g.total >= 0 ? "var(--income)" : "var(--muted)"}
                style={{ fontSize: "13px", fontWeight: 600 }}
              />
            </div>
            <div className="mov-card">
              {g.items.map((r) => <TransactionRow key={`${r.tipo}-${r.id}`} r={r} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
