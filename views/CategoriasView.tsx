"use client";

import { Pencil } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";
import CategoryIcon from "@/components/common/CategoryIcon";
import { categoriesOf, groupCategories } from "@/lib/categoryMeta";
import type { ViewType } from "@/types";

export default function CategoriasView() {
  const { data, setView } = useDashboardStore();
  const groups = groupCategories(categoriesOf(data, "gasto"));

  return (
    <>
      <div className="cats-head">
        <button onClick={() => setView("categorias-admin")} className="cats-edit">
          <Pencil size={14} /> Editar categorías
        </button>
      </div>

      {groups.map((g) => {
        // Total del grupo: suma de lo gastado este mes en sus categorías
        const total = g.categories.reduce(
          (sum, c) => sum + (data?.by_category.find((x) => x.category === c.name)?.total ?? 0),
          0
        );

        return (
          <section key={g.name || "all"} className="cats-group">
            {g.name && (
              <header className="cats-group-head">
                <span className="cats-dot" style={{ background: g.color }} aria-hidden />
                <h3>{g.name}</h3>
                {total > 0 && <span className="cats-group-total">{fmt(total)}</span>}
              </header>
            )}

            <div className="cats-grid">
              {g.categories.map((c) => {
                const cat = data?.by_category.find((x) => x.category === c.name);
                const label = cat ? `${fmt(cat.total)} este mes` : "Sin gastos este mes";
                const catView: ViewType = `cat-${c.name}`;

                return (
                  <button key={c.name} onClick={() => setView(catView)} className="cat-card">
                    <CategoryIcon icon={c.icon} color={c.color} size={40} shape="rounded" />
                    <span className="cat-text">
                      <span className="cat-name">{c.name}</span>
                      <span className="cat-amount">{label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <style>{`
        .cats-head {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 10px;
        }

        .cats-edit {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          color: var(--sage);
          cursor: pointer;
          font-family: var(--font-sans);
        }

        .cats-group + .cats-group {
          margin-top: 18px;
        }

        .cats-group-head {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 8px;
          padding: 0 2px;
        }

        .cats-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        .cats-group-head h3 {
          margin: 0;
          font-size: 12px;
          font-weight: 700;
          color: var(--sub);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-family: var(--font-sans);
        }

        .cats-group-total {
          margin-left: auto;
          font-size: 11px;
          font-weight: 600;
          color: var(--muted);
          font-variant-numeric: tabular-nums;
        }

        .cats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: clamp(6px, 2vw, 12px);
        }

        .cat-card {
          display: flex;
          align-items: center;
          gap: clamp(8px, 2vw, 12px);
          padding: clamp(10px, 2.5vw, 14px);
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: 12px;
          cursor: pointer;
          font-family: var(--font-sans);
          text-align: left;
          transition: background 0.15s;
          min-width: 0;
        }

        .cat-card:active {
          background: var(--bg);
        }

        .cat-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          flex: 1;
        }

        .cat-name {
          font-size: clamp(11px, 3vw, 13px);
          font-weight: 600;
          color: var(--text);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .cat-amount {
          font-size: clamp(9px, 2.5vw, 11px);
          color: var(--muted);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 360px) {
          .cats-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (min-width: 600px) {
          .cats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </>
  );
}
