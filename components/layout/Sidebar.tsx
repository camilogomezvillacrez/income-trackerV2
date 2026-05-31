"use client";

import { LayoutDashboard, ArrowLeftRight, Target } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import type { ViewType } from "@/types";
import { CAT_META, EXP_CATS } from "@/constants/categories";

interface SidebarItemProps {
  icon?: React.ReactNode;
  emoji?: string;
  emojiColor?: string;
  label: string;
  view: ViewType;
  active: boolean;
  onClick: () => void;
}

function SidebarItem({ icon, emoji, emojiColor, label, active, onClick }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "8px 14px",
        cursor: "pointer",
        margin: "0 6px 2px",
        borderRadius: "7px",
        background: active ? "#EEF2FF" : "transparent",
        border: "none",
        width: "calc(100% - 12px)",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
        transition: "background 0.15s",
      }}
    >
      <span style={{ color: active ? "#1D4ED8" : "var(--sub)", display: "flex", alignItems: "center" }}>
        {icon}
        {emoji && (
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "7px",
              background: emojiColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "15px",
            }}
          >
            {emoji}
          </span>
        )}
      </span>
      <span
        style={{
          fontSize: "12px",
          color: active ? "#1D4ED8" : "var(--sub)",
          fontWeight: active ? 600 : 500,
        }}
      >
        {label}
      </span>
    </button>
  );
}

export default function Sidebar() {
  const { view, setView } = useDashboardStore();

  return (
    <aside
      style={{
        width: "212px",
        flexShrink: 0,
        background: "var(--white)",
        borderRight: "1px solid var(--border)",
        padding: "16px 0",
        overflowY: "auto",
      }}
    >
      <p
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "0 14px",
          marginBottom: "6px",
        }}
      >
        General
      </p>

      <SidebarItem
        icon={<LayoutDashboard size={16} />}
        label="Resumen"
        view="resumen"
        active={view === "resumen"}
        onClick={() => setView("resumen")}
      />
      <SidebarItem
        icon={<ArrowLeftRight size={16} />}
        label="Movimientos"
        view="movimientos"
        active={view === "movimientos"}
        onClick={() => setView("movimientos")}
      />
      <SidebarItem
        icon={<Target size={16} />}
        label="Metas"
        view="metas"
        active={view === "metas"}
        onClick={() => setView("metas")}
      />

      <p
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--muted)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          padding: "0 14px",
          marginTop: "14px",
          marginBottom: "6px",
        }}
      >
        Categorías
      </p>

      {EXP_CATS.map((cat) => {
        const m = CAT_META[cat];
        const catView: ViewType = `cat-${cat}`;
        return (
          <SidebarItem
            key={cat}
            emoji={m.emoji}
            emojiColor={m.bg}
            label={cat}
            view={catView}
            active={view === catView}
            onClick={() => setView(catView)}
          />
        );
      })}
    </aside>
  );
}
