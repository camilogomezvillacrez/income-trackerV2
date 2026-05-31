"use client";

import { useDashboardStore } from "@/store/dashboardStore";
import type { ViewType } from "@/types";

interface BnItem {
  emoji: string;
  label: string;
  view: ViewType;
  id: string;
}

const ITEMS: BnItem[] = [
  { emoji: "🏠", label: "Resumen",      view: "resumen",      id: "bn-resumen" },
  { emoji: "↔️",  label: "Movimientos", view: "movimientos",  id: "bn-mov"     },
  { emoji: "🎯", label: "Metas",        view: "metas",        id: "bn-metas"   },
  { emoji: "📂", label: "Categorías",   view: "cats",         id: "bn-cats"    },
];

export default function BottomNav() {
  const { view, setView } = useDashboardStore();

  return (
    <nav
      style={{
        width: "100%",
        height: "62px",
        flexShrink: 0,
        background: "#4A7C59",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 4px",
      }}
    >
      {ITEMS.map((item) => {
        const active = view === item.view || (item.view === "cats" && view.startsWith("cat-"));
        return (
          <button
            key={item.id}
            id={item.id}
            onClick={() => setView(item.view)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "6px 12px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              background: active ? "rgba(255,255,255,.18)" : "transparent",
              fontFamily: "var(--font-sans)",
              flex: 1,
              transition: "background 0.15s",
            }}
          >
            <span style={{ fontSize: "20px", lineHeight: 1 }}>{item.emoji}</span>
            <span
              style={{
                fontSize: "9px",
                fontWeight: active ? 700 : 500,
                color: active ? "#fff" : "rgba(255,255,255,.8)",
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
