"use client";

import { LayoutDashboard, ArrowLeftRight, Target, Settings, Bot } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import type { ViewType } from "@/types";
import { CAT_META, EXP_CATS } from "@/constants/categories";

function SidebarItem({ icon, emoji, emojiColor, label, active, onClick }: {
  icon?: React.ReactNode; emoji?: string; emojiColor?: string;
  label: string; view?: ViewType; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", cursor: "pointer", margin: "0 6px 2px", borderRadius: "7px", background: active ? "#EEF2FF" : "transparent", border: "none", width: "calc(100% - 12px)", textAlign: "left", fontFamily: "var(--font-sans)", transition: "background 0.15s" }}
    >
      <span style={{ color: active ? "#1D4ED8" : "var(--sub)", display: "flex", alignItems: "center" }}>
        {icon}
        {emoji && (
          <span style={{ width: "28px", height: "28px", borderRadius: "7px", background: emojiColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>
            {emoji}
          </span>
        )}
      </span>
      <span style={{ fontSize: "12px", color: active ? "#1D4ED8" : "var(--sub)", fontWeight: active ? 600 : 500 }}>
        {label}
      </span>
    </button>
  );
}

const sectionLabel = (text: string, mt = 0) => (
  <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--muted)", letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 14px", marginBottom: "6px", marginTop: mt }}>
    {text}
  </p>
);

export default function Sidebar() {
  const { view, setView } = useDashboardStore();

  return (
    <aside style={{ width: "212px", flexShrink: 0, background: "var(--white)", borderRight: "1px solid var(--border)", padding: "16px 0", overflowY: "auto" }}>
      {sectionLabel("General", 4)}
      <SidebarItem icon={<LayoutDashboard size={16} />} label="Resumen" active={view === "resumen"} onClick={() => setView("resumen")} />
      <SidebarItem icon={<ArrowLeftRight size={16} />} label="Movimientos" active={view === "movimientos"} onClick={() => setView("movimientos")} />
      <SidebarItem icon={<Target size={16} />} label="Metas" active={view === "metas"} onClick={() => setView("metas")} />
      <SidebarItem icon={<Bot size={16} />} label="Asistente IA" active={view === "asistente"} onClick={() => setView("asistente")} />
      <SidebarItem icon={<Settings size={16} />} label="Configuración" active={view === "configuracion"} onClick={() => setView("configuracion")} />

      {sectionLabel("Categorías", 14)}
      {EXP_CATS.map((cat) => {
        const m = CAT_META[cat];
        const v: ViewType = `cat-${cat}`;
        return (
          <SidebarItem key={cat} emoji={m.emoji} emojiColor={m.bg} label={cat} active={view === v} onClick={() => setView(v)} />
        );
      })}
    </aside>
  );
}
