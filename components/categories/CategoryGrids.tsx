"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import CategoryIcon from "@/components/common/CategoryIcon";
import { groupCategories } from "@/lib/categoryMeta";
import type { Category, Subcategory } from "@/types";

const sectionLabel: React.CSSProperties = {
  fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

interface Hit {
  cat: Category;
  /** La subcategoría que hizo match, si la búsqueda dio con una. */
  sub: Subcategory | null;
}

/**
 * Elegir categoría al registrar un movimiento.
 *
 * Aquí no se explora, se decide rápido: arriba van las que el usuario usa de
 * verdad (`frequent`) y el resto queda detrás de "Ver todas" o del buscador.
 * Agrupar todo de entrada obligaba a desplazar media pantalla para un gasto
 * que casi siempre cae en las mismas cuatro categorías.
 */
export function CategoryGrid({ categories, selected, onSelect, frequent }: {
  categories: Category[];
  selected: string | null;
  /** `sub` llega cuando la búsqueda acertó en una subcategoría: se elige sola. */
  onSelect: (name: string, sub?: string | null) => void;
  /** Las destacadas. Sin esto se muestran todas, agrupadas. */
  frequent?: Category[];
}) {
  const [query, setQuery] = useState("");
  const [todas, setTodas] = useState(false);

  const q = norm(query.trim());

  const hits = useMemo<Hit[]>(() => {
    if (!q) return [];
    const out: Hit[] = [];
    for (const c of categories) {
      if (norm(c.name).includes(q)) out.push({ cat: c, sub: null });
      for (const s of c.subs) {
        if (norm(s.name).includes(q)) out.push({ cat: c, sub: s });
      }
    }
    return out.slice(0, 12);
  }, [q, categories]);

  const destacadas = frequent ?? categories;
  const hayMas = destacadas.length < categories.length;
  const verAgrupado = !frequent || todas;

  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        <p style={{ ...sectionLabel, flexShrink: 0 }}>Categoría</p>
        <label style={{
          display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0,
          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "999px",
          padding: "6px 10px",
        }}>
          <Search size={13} color="var(--muted)" aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar categoría o subcategoría"
            style={{
              flex: 1, minWidth: 0, border: "none", outline: "none", background: "none",
              fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-sans)",
            }}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              style={{ display: "grid", placeItems: "center", background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--muted)" }}
            >
              <X size={14} />
            </button>
          )}
        </label>
      </div>

      {q ? (
        hits.length === 0 ? (
          <p style={{ fontSize: "12.5px", color: "var(--muted)", padding: "10px 2px" }}>
            Nada con “{query.trim()}”.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {hits.map((h) => {
              const active = selected === h.cat.name;
              return (
                <button
                  key={`${h.cat.name}-${h.sub?.name ?? ""}`}
                  onClick={() => { onSelect(h.cat.name, h.sub?.name ?? null); setQuery(""); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px", padding: "9px 11px",
                    border: `1.5px solid ${active ? h.cat.color : "var(--border)"}`, borderRadius: "10px",
                    background: active ? `${h.cat.color}14` : "var(--bg)",
                    cursor: "pointer", fontFamily: "var(--font-sans)", textAlign: "left", width: "100%",
                  }}
                >
                  {h.sub
                    ? <span style={{ fontSize: "17px", lineHeight: 1, width: 24, textAlign: "center" }}>{h.sub.emoji || "📌"}</span>
                    : <CategoryIcon icon={h.cat.icon} color={h.cat.color} size={24} shape="rounded" />}
                  <span style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: "var(--text)" }}>
                      {h.sub ? h.sub.name : h.cat.name}
                    </span>
                    {h.sub && (
                      <span style={{ fontSize: "11px", color: "var(--muted)" }}>en {h.cat.name}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )
      ) : (
        <>
          {!verAgrupado && <Tiles cats={destacadas} selected={selected} onSelect={onSelect} />}

          {verAgrupado && groupCategories(categories).map((g) => (
            <div key={g.name || "all"} style={{ marginBottom: g.name ? "12px" : 0 }}>
              {g.name && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px", margin: "0 0 6px" }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: g.color, flexShrink: 0 }} aria-hidden />
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--sub)", letterSpacing: "0.04em" }}>
                    {g.name}
                  </span>
                </div>
              )}
              <Tiles cats={g.categories} selected={selected} onSelect={onSelect} />
            </div>
          ))}

          {hayMas && (
            <button
              onClick={() => setTodas(!todas)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "5px",
                width: "100%", marginTop: "8px", padding: "8px",
                background: "none", border: "none", cursor: "pointer",
                fontSize: "12.5px", fontWeight: 600, color: "var(--sage)", fontFamily: "var(--font-sans)",
              }}
            >
              <ChevronDown size={15} style={{ transform: todas ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              {todas ? "Ver menos" : `Ver todas (${categories.length})`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/** La cuadrícula de siempre, sin título. */
function Tiles({ cats, selected, onSelect }: {
  cats: Category[];
  selected: string | null;
  onSelect: (name: string, sub?: string | null) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
      {cats.map((c) => {
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
      <p style={{ ...sectionLabel, marginBottom: "8px" }}>
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
