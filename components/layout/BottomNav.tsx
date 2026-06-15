"use client";

import { Home, ArrowLeftRight, Target, FolderOpen, Settings } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import type { ViewType } from "@/types";

interface BnItem {
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  label: string;
  view: ViewType;
  id: string;
}

const ITEMS: BnItem[] = [
  { icon: <Home size={22} strokeWidth={1.8} />,            iconActive: <Home size={22} strokeWidth={2.5} />,            label: "Resumen",      view: "resumen",       id: "bn-resumen" },
  { icon: <ArrowLeftRight size={22} strokeWidth={1.8} />,  iconActive: <ArrowLeftRight size={22} strokeWidth={2.5} />,  label: "Movimientos",  view: "movimientos",   id: "bn-mov"     },
  { icon: <Target size={22} strokeWidth={1.8} />,          iconActive: <Target size={22} strokeWidth={2.5} />,          label: "Metas",        view: "metas",         id: "bn-metas"   },
  { icon: <FolderOpen size={22} strokeWidth={1.8} />,      iconActive: <FolderOpen size={22} strokeWidth={2.5} />,      label: "Categorías",   view: "cats",          id: "bn-cats"    },
  { icon: <Settings size={22} strokeWidth={1.8} />,        iconActive: <Settings size={22} strokeWidth={2.5} />,        label: "Config",       view: "configuracion", id: "bn-config"  },
];

export default function BottomNav() {
  const { view, setView } = useDashboardStore();

  return (
    <nav
      style={{
        width: "100%",
        height: "calc(86px + env(safe-area-inset-bottom, 0px))",
        flexShrink: 0,
        background: "#4A7C59",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "4px",
        paddingRight: "4px",
      }}
    >
      {ITEMS.map((item) => {
        const active = view === item.view
          || (item.view === "cats" && view.startsWith("cat-"))
          || (item.view === "configuracion" && view === "configuracion");
        return (
          <button
            key={item.id}
            id={item.id}
            onClick={() => setView(item.view)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 10px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              background: active ? "rgba(255,255,255,.18)" : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,.75)",
              fontFamily: "var(--font-sans)",
              flex: 1,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {active ? item.iconActive : item.icon}
            <span style={{ fontSize: "9px", fontWeight: active ? 700 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
