"use client";

import CategoryIcon from "@/components/common/CategoryIcon";
import { groupCategories } from "@/lib/categoryMeta";
import type { Category, Subcategory } from "@/types";

const sectionLabel: React.CSSProperties = {
  fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", marginBottom: "8px",
};

/** Cuadrícula de categorías para registrar/editar un movimiento, por grupos. */
export function CategoryGrid({ categories, selected, onSelect }: {
  categories: Category[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const groups = groupCategories(categories);

  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={sectionLabel}>Categoría</p>

      {groups.map((g) => (
        <div key={g.name || "all"} style={{ marginBottom: g.name ? "12px" : 0 }}>
          {g.name && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 6px" }}>
              <span style={{ width: 7, height: 7, borderRadius: 2, background: g.color, flexShrink: 0 }} aria-hidden />
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--sub)", letterSpacing: "0.04em" }}>
                {g.name}
              </span>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
            {g.categories.map((c) => {
              const active = selected === c.name;
              return (
                <button
                  key={`${c.tipo}-${c.name}`}
                  onClick={() => onSelect(c.name)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                    padding: "10px 4px 8px", minWidth: 0,
                    border: `2px solid ${active ? c.color : "var(--border)"}`, borderRadius: "10px",
                    background: active ? `${c.color}14` : "var(--bg)",
                    cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s",
                  }}
                >
                  <CategoryIcon icon={c.icon} color={c.color} size={30} shape="rounded" />
                  <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--sub)", textAlign: "center", lineHeight: 1.3, overflowWrap: "anywhere" }}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Subcategorías (opcional) de la categoría elegida, como chips en una fila que envuelve. */
export function SubcatGrid({ subs, selected, onSelect }: {
  subs: Subcategory[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={sectionLabel}>
        Subcategoría <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(opcional)</span>
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {subs.map((s) => {
          const active = selected === s.name;
          return (
            <button
              key={s.name}
              onClick={() => onSelect(active ? "" : s.name)}
              style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                padding: "7px 11px",
                border: `1.5px solid ${active ? "var(--text)" : "var(--border)"}`, borderRadius: "999px",
                background: active ? "#EEF2FF" : "var(--bg)",
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "14px", lineHeight: 1 }}>{s.emoji || "📌"}</span>
              <span style={{ fontSize: "12px", fontWeight: active ? 600 : 500, color: "var(--sub)", lineHeight: 1.2 }}>
                {s.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
