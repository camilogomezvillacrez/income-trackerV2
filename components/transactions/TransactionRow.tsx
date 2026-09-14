"use client";

import { Trash2 } from "lucide-react";
import type { Movement } from "@/types";
import { CAT_META, paymentMeta } from "@/constants/categories";
import { useDashboardStore } from "@/store/dashboardStore";
import Money from "@/components/common/Money";
import { useRef } from "react";

interface Props {
  r: Movement;
  /** Sin padding lateral: para listas dentro de un panel que ya tiene el suyo. */
  flush?: boolean;
}

export default function TransactionRow({ r, flush = false }: Props) {
  const { openModal, setEditTarget, setDeleteTarget } = useDashboardStore();
  const innerRef = useRef<HTMLDivElement>(null);
  const startX   = useRef(0);
  const startY   = useRef(0);
  const moved    = useRef(false);

  const isInc = r.tipo === "ingreso";
  const emoji = CAT_META[r.category]?.emoji ?? "💰";

  // Subtítulo en texto simple, sin chips: "Suscripciones · Nu"
  const pm = !isInc && r.payment_method && r.payment_method !== "Efectivo"
    ? paymentMeta(r.payment_method).short
    : null;
  const subtitle = [r.category, pm].filter(Boolean).join(" · ");

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

  // Tocar la fila edita; si venía de deslizar o estaba abierta, solo se cierra
  function onRowClick() {
    if (moved.current) return;
    const el = innerRef.current;
    if (el?.style.transform) { el.style.transform = ""; return; }
    handleEdit();
  }

  return (
    <div
      className="tx-row"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Acción al deslizar */}
      <div className="tx-swipe-bg">
        <button onClick={handleDelete} aria-label="Eliminar movimiento">
          <Trash2 size={20} />
        </button>
      </div>

      <div
        ref={innerRef}
        className="tx-swipe-inner"
        role="button"
        tabIndex={0}
        aria-label={`Editar ${r.note || r.category}`}
        onClick={onRowClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleEdit(); }
        }}
        style={{ padding: flush ? "10px 0" : "11px 14px" }}
      >
        <div className="tx-icon" aria-hidden>{emoji}</div>

        <div className="tx-text">
          <div className="tx-title">{r.note || r.category}</div>
          <div className="tx-meta">{subtitle}</div>
        </div>

        <div className="tx-end">
          <Money
            value={r.amount}
            prefix={isInc ? "+" : "-"}
            color={isInc ? "var(--income)" : "var(--expense)"}
            style={{ fontSize: "14.5px", fontWeight: 600, whiteSpace: "nowrap" }}
          />
          {/* Con mouse no hay deslizar: la basura aparece al pasar por encima */}
          <button
            className="tx-hover-delete"
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            aria-label="Eliminar movimiento"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
