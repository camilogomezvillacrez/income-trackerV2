"use client";

import { useState } from "react";
import { CreditCard, Pencil, Trash2, Plus, X } from "lucide-react";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { paymentsOf } from "@/lib/paymentMeta";
import { PAYMENT_EMOJIS, PAYMENT_KINDS, defaultShort, inferPaymentMeta } from "@/constants/payments";
import type { PaymentKind, PaymentMethod } from "@/types";

interface Draft {
  id: number | null;
  name: string;
  emoji: string;
  short: string;
  kind: PaymentKind;
  last4: string;
}

const emptyDraft = (): Draft => ({ id: null, name: "", emoji: "💳", short: "", kind: "credito", last4: "" });

const toDraft = (m: PaymentMethod): Draft => ({
  id: m.id, name: m.name, emoji: m.emoji, short: m.short, kind: m.kind, last4: m.last4 ?? "",
});

export default function MediosPagoPanel() {
  const { data, refresh } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const methods = paymentsOf(data);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!draft) return;
    const name = draft.name.trim();
    if (!name) { toast("Ponle un nombre", "err"); return; }
    if (draft.last4 && !/^\d{4}$/.test(draft.last4)) { toast("Los dígitos deben ser 4 números", "err"); return; }

    setBusy(true);
    const res = await fetch(draft.id ? `/api/payments/${draft.id}` : "/api/payments", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        emoji: draft.emoji,
        short: draft.short.trim() || defaultShort(name),
        kind: draft.kind,
        last4: draft.last4.trim(),
      }),
    });
    if (res.ok) {
      setDraft(null);
      await refresh();
      toast(draft.id ? "✓ Medio actualizado" : "✓ Medio agregado");
    } else {
      toast((await res.json().catch(() => ({}))).error ?? "No se pudo guardar", "err");
    }
    setBusy(false);
  }

  /** Si el medio tiene gastos, la API responde 409 y aquí se pregunta a dónde moverlos. */
  async function remove(m: PaymentMethod, moveTo?: string) {
    setBusy(true);
    const res = await fetch(`/api/payments/${m.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(moveTo ? { moveTo } : {}),
    });

    if (res.status === 409) {
      const { inUse, options } = await res.json();
      const total = inUse.movements + inUse.fixed;
      const destino = prompt(
        `"${m.name}" tiene ${total} registro(s). Escribe a qué medio pasarlos:\n\n${options.join("\n")}`,
        options[0]
      );
      setBusy(false);
      if (destino && options.includes(destino)) await remove(m, destino);
      return;
    }

    if (res.ok) { await refresh(); toast("Medio eliminado"); }
    else toast((await res.json().catch(() => ({}))).error ?? "No se pudo borrar", "err");
    setBusy(false);
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <CreditCard size={16} color="var(--blue)" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Medios de pago</span>
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
        Tus tarjetas y formas de pago: aparecen al registrar un gasto y en los gastos fijos.
        Los últimos 4 dígitos son opcionales y sirven para reconocer la tarjeta que manda Apple Pay.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
        {methods.map((m) => (
          <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 12px" }}>
            <span style={{ fontSize: "17px" }}>{m.emoji}</span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", overflowWrap: "anywhere" }}>
                {m.name}{m.last4 ? ` ••${m.last4}` : ""}
              </span>
              <span style={{ display: "block", fontSize: "11px", color: "var(--muted)" }}>
                {PAYMENT_KINDS.find((k) => k.value === m.kind)?.label ?? "Otro"} · en la lista sale como {m.short}
              </span>
            </span>
            <button onClick={() => setDraft(toDraft(m))} aria-label={`Editar ${m.name}`} style={iconBtn}>
              <Pencil size={14} />
            </button>
            <button onClick={() => remove(m)} disabled={busy} aria-label={`Borrar ${m.name}`} style={{ ...iconBtn, color: "var(--red)" }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {draft ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: "8px", padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>
              {draft.id ? "Editar medio" : "Nuevo medio"}
            </span>
            <button onClick={() => setDraft(null)} aria-label="Cancelar" style={iconBtn}><X size={14} /></button>
          </div>

          <label style={label}>Nombre</label>
          <input
            value={draft.name}
            onChange={(e) => {
              const name = e.target.value;
              // En uno nuevo, emoji y nombre corto siguen al nombre mientras no los toques
              setDraft((d) => d && {
                ...d,
                name,
                emoji: d.id === null && !emojiTocado(d) ? inferPaymentMeta(name).emoji : d.emoji,
                short: d.id === null && (!d.short || d.short === defaultShort(d.name)) ? defaultShort(name) : d.short,
              });
            }}
            placeholder="Ej: Nu Crédito"
            style={inp}
          />

          <label style={label}>Emoji</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
            {PAYMENT_EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setDraft((d) => d && { ...d, emoji: e })}
                style={{ width: "36px", height: "36px", fontSize: "17px", borderRadius: "8px", cursor: "pointer", background: draft.emoji === e ? "#EEF2FF" : "var(--bg)", border: `1.5px solid ${draft.emoji === e ? "var(--text)" : "var(--border)"}` }}
              >
                {e}
              </button>
            ))}
          </div>

          <label style={label}>Tipo</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "10px" }}>
            {PAYMENT_KINDS.map((k) => (
              <button
                key={k.value}
                onClick={() => setDraft((d) => d && { ...d, kind: k.value })}
                style={{ padding: "8px 6px", borderRadius: "8px", cursor: "pointer", fontSize: "11.5px", fontWeight: 600, fontFamily: "var(--font-sans)", background: draft.kind === k.value ? "#EEF2FF" : "var(--bg)", border: `1.5px solid ${draft.kind === k.value ? "var(--text)" : "var(--border)"}`, color: draft.kind === k.value ? "var(--text)" : "var(--sub)" }}
              >
                {k.emoji} {k.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Nombre corto</label>
              <input
                value={draft.short}
                onChange={(e) => setDraft((d) => d && { ...d, short: e.target.value })}
                placeholder={draft.name ? defaultShort(draft.name) : "Nu"}
                style={inp}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Últimos 4 (opcional)</label>
              <input
                value={draft.last4}
                onChange={(e) => setDraft((d) => d && { ...d, last4: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                inputMode="numeric"
                placeholder="4821"
                style={{ ...inp, fontFamily: "var(--font-mono)" }}
              />
            </div>
          </div>

          <button
            onClick={save}
            disabled={busy}
            style={{ width: "100%", marginTop: "4px", background: "var(--text)", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--font-sans)" }}
          >
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      ) : (
        <button
          onClick={() => setDraft(emptyDraft())}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "none", border: "1px dashed var(--border)", color: "var(--sub)", borderRadius: "8px", padding: "11px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
        >
          <Plus size={15} /> Agregar medio de pago
        </button>
      )}
    </div>
  );
}

/** El emoji cuenta como tocado a mano si ya no es el que sugiere el nombre. */
function emojiTocado(d: Draft) {
  return d.emoji !== "💳" && d.emoji !== inferPaymentMeta(d.name).emoji;
}

const iconBtn: React.CSSProperties = {
  flexShrink: 0, width: "30px", height: "30px", display: "flex", alignItems: "center",
  justifyContent: "center", background: "none", border: "none", borderRadius: "6px",
  cursor: "pointer", color: "var(--muted)",
};

const label: React.CSSProperties = {
  display: "block", fontSize: "10px", fontWeight: 600, color: "var(--muted)",
  textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px",
};

const inp: React.CSSProperties = {
  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
  borderRadius: "8px", padding: "10px 12px", fontSize: "13.5px", color: "var(--text)",
  outline: "none", marginBottom: "10px", fontFamily: "var(--font-sans)",
};
