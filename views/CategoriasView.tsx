"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import { CAT_META, EXP_CATS } from "@/constants/categories";
import { fmt } from "@/lib/utils";
import type { ViewType } from "@/types";

export default function CategoriasView() {
  const { data, setView } = useDashboardStore();

  return (
    <>
      <div className="cats-grid">
        {EXP_CATS.map((name) => {
          const m = CAT_META[name];
          const cat = data?.by_category.find((c) => c.category === name);
          const total = cat ? `${fmt(cat.total)} este mes` : "Sin gastos este mes";
          const catView: ViewType = `cat-${name}`;

          return (
            <button
              key={name}
              onClick={() => setView(catView)}
              className="cat-card"
            >
              <span className="cat-icon" style={{ background: m.bg }}>
                {m.emoji}
              </span>
              <span className="cat-text">
                <span className="cat-name">{name}</span>
                <span className="cat-amount">{total}</span>
              </span>
            </button>
          );
        })}
      </div>

      <style>{`
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

        .cat-icon {
          font-size: clamp(20px, 5vw, 28px);
          line-height: 1;
          flex-shrink: 0;
          padding: clamp(6px, 1.5vw, 8px);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
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
