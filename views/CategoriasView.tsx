"use client";

import { Pencil } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { fmt } from "@/lib/utils";
import CategoryIcon from "@/components/common/CategoryIcon";
import { categoriesOf } from "@/lib/categoryMeta";
import type { ViewType } from "@/types";

export default function CategoriasView() {
  const { data, setView } = useDashboardStore();
  const categories = categoriesOf(data, "gasto");

  return (
    <>
      <div className="cats-head">
        <button onClick={() => setView("categorias-admin")} className="cats-edit">
          <Pencil size={14} /> Editar categorías
        </button>
      </div>

      <div className="cats-grid">
        {categories.map((c) => {
          const cat = data?.by_category.find((x) => x.category === c.name);
          const total = cat ? `${fmt(cat.total)} este mes` : "Sin gastos este mes";
          const catView: ViewType = `cat-${c.name}`;

          return (
            <button
              key={c.name}
              onClick={() => setView(catView)}
              className="cat-card"
            >
              <CategoryIcon icon={c.icon} color={c.color} size={40} shape="rounded" />
              <span className="cat-text">
                <span className="cat-name">{c.name}</span>
                <span className="cat-amount">{total}</span>
              </span>
            </button>
          );
        })}
      </div>

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
