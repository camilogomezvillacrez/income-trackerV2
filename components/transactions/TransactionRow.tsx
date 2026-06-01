"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { Movement } from "@/types";
import { CAT_META } from "@/constants/categories";
import { useDashboardStore } from "@/store/dashboardStore";
import Money from "@/components/common/Money";
import { useRef } from "react";

interface Props { r: Movement; }

export default function TransactionRow({ r }: Props) {
  const { openModal, setEditTarget, setDeleteTarget } = useDashboardStore();
  const innerRef = useRef<HTMLDivElement>(null);
  const startX   = useRef(0);
  const startY   = useRef(0);
  const moved    = useRef(false);

  const isInc = r.tipo === "ingreso";
  const color = isInc ? "var(--green)" : "var(--red)";
  const meta  = CAT_META[r.category] ?? { emoji: "💰", color: "#6B7280", bg: "#F3F4F6" };

  const pmLabel =
    !isInc && r.payment_method && r.payment_method !== "Efectivo"
      ? ` · ${r.payment_method === "Visa Crédito" ? "💳 Visa" : "🟣 Nu"}`
      : "";
  const catLabel = r.subcategory
    ? `${meta.emoji} ${r.category} · ${r.subcategory}`
    : `${meta.emoji} ${r.category}`;

  function handleEdit()   { setEditTarget({ tipo: r.tipo, id: r.id }); openModal("edit"); }
  function handleDelete() { setDeleteTarget({ tipo: r.tipo, id: r.id, desc: r.note || r.category, amount: r.amount }); openModal("del"); }

  function onTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    moved.current  = false;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!innerRef.current) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (!moved.current && Math.abs(dy) > Math.abs(dx)) return;
    moved.current = true;
    if (dx > 10) { innerRef.current.style.transform = ""; return; }
    innerRef.current.style.transform = `translateX(${Math.max(dx, -80)}px)`;
    e.preventDefault();
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (!innerRef.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    innerRef.current.style.transform = dx < -50 ? "translateX(-80px)" : "";
  }

  return (
    <div
      style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid var(--border)" }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Swipe background */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "72px", background: "var(--red-bg)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 0 }}>
        <button onClick={handleDelete} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", padding: "0 16px" }}>
          <Trash2 size={20} />
        </button>
      </div>

      {/* Row */}
      <div
        ref={innerRef}
        className="tx-swipe-inner"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", background: "var(--white)", position: "relative", zIndex: 1 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          {/* Category emoji icon */}
          <div
            style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: meta.bg, display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0, fontSize: "17px", lineHeight: 1,
            }}
          >
            {meta.emoji}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "12px", color: "var(--text)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.note || r.category}
            </div>
            <div style={{ fontSize: "10px", color: "var(--muted)", marginTop: "2px", display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", borderRadius: "4px", padding: "1px 6px", fontSize: "9px", fontWeight: 600, background: `${meta.color}26`, color: meta.color, border: `1px solid ${meta.color}50` }}>
                {catLabel}{pmLabel}
              </span>
              <span style={{ color: "var(--muted)" }}>{r.date}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <Money
            value={r.amount}
            prefix={isInc ? "+" : "-"}
            color={color}
            style={{ fontSize: "12px", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "1px", marginLeft: "6px" }}>
            <button onClick={handleEdit}   style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px 5px", borderRadius: "5px" }} title="Editar"><Pencil size={13} /></button>
            <button onClick={handleDelete} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "4px 5px", borderRadius: "5px" }} title="Eliminar"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
