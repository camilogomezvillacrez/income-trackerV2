"use client";

import { useEffect, useState } from "react";
import { Wallet, Copy, Check } from "lucide-react";
import { useToastStore } from "@/store/dashboardStore";

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Sin permiso de portapapeles: el valor sigue visible para copiarlo a mano
    }
  }
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ fontSize: "10px", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>{label}</div>
      <div style={{ display: "flex", gap: "6px" }}>
        <code style={{ flex: 1, minWidth: 0, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", padding: "9px 10px", fontSize: "11.5px", fontFamily: "var(--font-mono)", color: "var(--text)", overflowWrap: "anywhere" }}>
          {value}
        </code>
        <button
          onClick={copy}
          aria-label={`Copiar ${label}`}
          style={{ flexShrink: 0, width: "40px", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", color: copied ? "var(--green)" : "var(--muted)" }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
    </div>
  );
}

const STEPS: React.ReactNode[] = [
  <>Abre <b>Atajos</b> → <b>Automatización</b> → <b>+</b> → <b>Transacción</b>. Elige tus tarjetas y marca <b>Ejecutar inmediatamente</b>.</>,
  <>Crea una automatización en blanco y agrega la acción <b>Obtener contenido de URL</b>.</>,
  <>Pega la <b>URL</b> de arriba. Toca la flecha: <b>Método</b> POST, <b>Encabezados</b>: clave <code>Authorization</code>, valor <code>Bearer</code> + espacio + tu token.</>,
  <><b>Cuerpo de solicitud</b>: JSON con 3 campos de texto: <code>amount</code> = Cantidad, <code>merchant</code> = Comercio, <code>card</code> = Tarjeta o pase (variables de la entrada del atajo).</>,
  <>Opcional: agrega <b>Mostrar notificación</b> con <b>Contenido de URL</b> para ver lo que se registró.</>,
];

export default function WalletShortcutPanel() {
  const toast = useToastStore((s) => s.show);
  const [active, setActive] = useState<boolean | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin] = useState(() => (typeof window === "undefined" ? "" : window.location.origin));

  useEffect(() => {
    fetch("/api/shortcut/token")
      .then((r) => (r.ok ? r.json() : { active: false }))
      .then((d) => setActive(!!d.active))
      .catch(() => setActive(false));
  }, []);

  async function generate() {
    if (active && !confirm("El token anterior dejará de funcionar. ¿Generar uno nuevo?")) return;
    setBusy(true);
    const res = await fetch("/api/shortcut/token", { method: "POST" });
    if (res.ok) {
      setToken((await res.json()).token);
      setActive(true);
    } else toast("No se pudo generar el token", "err");
    setBusy(false);
  }

  async function revoke() {
    if (!confirm("El atajo dejará de registrar gastos. ¿Revocar?")) return;
    setBusy(true);
    const res = await fetch("/api/shortcut/token", { method: "DELETE" });
    if (res.ok) { setActive(false); setToken(null); toast("Atajo desactivado"); }
    else toast("No se pudo revocar", "err");
    setBusy(false);
  }

  return (
    <div style={{ background: "var(--white)", border: "1px solid var(--border)", borderRadius: "10px", padding: "20px", marginBottom: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
        <Wallet size={16} color="#4A7C59" />
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Gastos automáticos con Apple Pay</span>
        {active && (
          <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--green)", background: "var(--bg)", borderRadius: "20px", padding: "2px 8px" }}>
            Activo
          </span>
        )}
      </div>
      <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "14px", lineHeight: 1.6 }}>
        Cada pago con Apple Pay se registra solo como gasto, con la categoría según el comercio.
      </p>

      {token && (
        <div style={{ marginBottom: "12px" }}>
          <CopyRow label="URL" value={`${origin}/api/shortcut/expense`} />
          <CopyRow label="Token (solo se muestra ahora)" value={token} />
          <ol style={{ fontSize: "12px", color: "var(--sub)", lineHeight: 1.6, paddingLeft: "18px", margin: "12px 0 0" }}>
            {STEPS.map((s, i) => <li key={i} style={{ marginBottom: "6px" }}>{s}</li>)}
          </ol>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={generate}
          disabled={busy || active === null}
          style={{ flex: 1, background: "#4A7C59", color: "#fff", border: "none", borderRadius: "8px", padding: "11px", fontSize: "13px", fontWeight: 600, cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, fontFamily: "var(--font-sans)" }}
        >
          {active ? "Generar token nuevo" : "Activar"}
        </button>
        {active && (
          <button
            onClick={revoke}
            disabled={busy}
            style={{ background: "none", color: "var(--red)", border: "1px solid var(--border)", borderRadius: "8px", padding: "11px 14px", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-sans)" }}
          >
            Revocar
          </button>
        )}
      </div>
    </div>
  );
}
