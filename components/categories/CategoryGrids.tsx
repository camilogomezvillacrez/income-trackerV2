"use client";

import CategoryIcon from "@/components/common/CategoryIcon";
import type { Category, Subcategory } from "@/types";

const sectionLabel: React.CSSProperties = {
  fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: "0.07em", marginBottom: "8px",
};

/** Cuadrícula de categorías para registrar/editar un movimiento. */
export function CategoryGrid({ categories, selected, onSelect }: {
  categories: Category[];
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <p style={sectionLabel}>Categoría</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
        {categories.map((c) => {
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
              <span style={{ fontSize: "9px", fontWeight: 600, color: "var(--sub)", textAlign: "center", lineHeight: 1.3, overflowWrap: "anywhere" }}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Cuadrícula de subcategorías (opcional) de la categoría elegida. */
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
        {subs.map((s) => {
          const active = selected === s.name;
          return (
            <button
              key={s.name}
              onClick={() => onSelect(active ? "" : s.name)}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                padding: "8px 4px 6px", minWidth: 0,
                border: `1.5px solid ${active ? "var(--text)" : "var(--border)"}`, borderRadius: "8px",
                background: active ? "#EEF2FF" : "var(--bg)",
                cursor: "pointer", fontFamily: "var(--font-sans)", transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: "17px", lineHeight: 1 }}>{s.emoji || "📌"}</span>
              <span style={{ fontSize: "9px", color: "var(--sub)", textAlign: "center", lineHeight: 1.2, overflowWrap: "anywhere" }}>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
