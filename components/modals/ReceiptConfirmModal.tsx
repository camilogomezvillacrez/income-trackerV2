"use client";

import { useState } from "react";
import Image from "next/image";
import { useDashboardStore, useToastStore } from "@/store/dashboardStore";
import { useReceiptStore } from "@/store/receiptStore";
import PaymentPicker from "@/components/payments/PaymentPicker";
import { CategoryGrid, SubcatGrid } from "@/components/categories/CategoryGrids";
import { categoriesOf, findCategory } from "@/lib/categoryMeta";
import { defaultPayment } from "@/lib/paymentMeta";
import { todayDate, fmtMiles, parseMiles } from "@/lib/utils";
import MoneyInput from "@/components/common/MoneyInput";

const CONFIANZA_LABEL = {
  alta: { text: "Lectura clara", bg: "#ECFDF5", color: "#047857" },
  media: { text: "Revisa los datos", bg: "#FFFBEB", color: "#B45309" },
  baja: { text: "Foto poco legible, revisa bien", bg: "#FEF2F2", color: "#B91C1C" },
};

/**
 * Nada entra a la contabilidad sin pasar por aquí: la IA propone y el usuario
 * confirma. Un OCR equivocado que se guarda solo daña las cuentas del mes.
 */
export default function ReceiptConfirmModal() {
  const { pending, setPending, markSaved } = useReceiptStore();
  const { refresh, data } = useDashboardStore();
  const toast = useToastStore((s) => s.show);

  const f = pending?.fields ?? null;

  const [proveedor, setProveedor] = useState(f?.proveedor ?? "");
  const [nit, setNit] = useState(f?.nit ?? "");
  const [valor, setValor] = useState(f?.valor != null ? fmtMiles(f.valor) : "");
  const [fecha, setFecha] = useState(f?.fecha ?? todayDate());
  const [correo, setCorreo] = useState(f?.correo ?? "");
  const [telefono, setTelefono] = useState(f?.telefono ?? "");
  const [nota, setNota] = useState(f?.nota ?? "");
  const [cat, setCat] = useState<string | null>(f?.categoria ?? null);
  const [subcat, setSubcat] = useState<string | null>(f?.subcategoria ?? null);
  const [pm, setPm] = useState(() => defaultPayment(data));
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(false);

  if (!pending) return null;

  function close() {
    URL.revokeObjectURL(pending!.previewUrl);
    setPending(null);
  }

  async function save() {
    if (parseMiles(valor) <= 0) { toast("Ingresa el valor del recibo", "err"); return; }
    if (!cat) { toast("Elige una categoría", "err"); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: pending!.pathname,
          proveedor, nit, correo, telefono, nota, fecha,
          valor: parseMiles(valor),
          category: cat,
          subcategory: subcat,
          payment_method: pm,
          raw: pending!.fields,
        }),
      });
      if (res.status === 401) { window.location.href = "/login"; return; }
      if (!res.ok) throw new Error();

      close();
      toast("🧾 Recibo guardado");
      markSaved();
      refresh();
    } catch {
      toast("No se pudo guardar el recibo", "err");
    } finally {
      setSaving(false);
    }
  }

  const categories = categoriesOf(data, "gasto");
  const subs = cat ? findCategory(data, cat, "gasto").subs : [];
  const conf = f ? CONFIANZA_LABEL[f.confianza] : null;

  return (
    <div style={overlay}>
      <div style={sheet}>
        <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "12px" }}>
          Confirma el recibo
        </h3>

        <div style={{ display: "flex", gap: "12px", marginBottom: "14px" }}>
          <button onClick={() => setZoom(true)} style={thumbBtn}>
            <Image
              src={pending.previewUrl}
              alt="Recibo"
              width={72}
              height={96}
              unoptimized
              style={{ objectFit: "cover", width: "72px", height: "96px", borderRadius: "8px" }}
            />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            {conf && (
              <span style={{ display: "inline-block", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "10px", background: conf.bg, color: conf.color, marginBottom: "8px" }}>
                {conf.text}
              </span>
            )}
            <p style={{ fontSize: "11px", color: "var(--muted)", lineHeight: 1.5 }}>
              {f ? "Revisa lo que leí y corrige lo que haga falta." : "No pude leer la foto; llena los datos a mano."}
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <Field label="Valor total" value={valor} onChange={setValor} money placeholder="45.000" />
          <Field label="Fecha" value={fecha} onChange={setFecha} type="date" />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <Field label="Proveedor" value={proveedor} onChange={setProveedor} placeholder="Nombre del negocio" />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
          <Field label="NIT" value={nit} onChange={setNit} placeholder="900123456-7" />
          <Field label="Teléfono" value={telefono} onChange={setTelefono} placeholder="3001234567" />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <Field label="Correo" value={correo} onChange={setCorreo} type="email" placeholder="facturacion@negocio.com" />
        </div>

        <div style={{ marginBottom: "14px" }}>
          <Field label="Descripción" value={nota} onChange={setNota} placeholder="Ej: almuerzo con cliente" />
        </div>

        <CategoryGrid categories={categories} selected={cat} onSelect={(n) => { setCat(n); setSubcat(null); }} />
        {subs.length > 0 && <SubcatGrid subs={subs} selected={subcat} onSelect={setSubcat} />}

        <PaymentPicker value={pm} onChange={setPm} />

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={close} disabled={saving} style={btnSecondary}>Descartar</button>
          <button onClick={save} disabled={saving} style={btnPrimary}>
            {saving ? "Guardando…" : "Guardar gasto"}
          </button>
        </div>
      </div>

      {zoom && (
        <div onClick={() => setZoom(false)} style={{ ...overlay, background: "rgba(0,0,0,.85)", zIndex: 400, padding: "20px" }}>
          <Image
            src={pending.previewUrl}
            alt="Recibo"
            width={1200}
            height={1600}
            unoptimized
            style={{ objectFit: "contain", width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
          />
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", money, placeholder }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  /** Campo de plata: puntos de miles mientras se escribe */
  money?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {money ? (
        <MoneyInput value={value} onChange={onChange} placeholder={placeholder} style={inputStyle} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,.45)",
  zIndex: 300,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "16px",
};

const sheet: React.CSSProperties = {
  background: "var(--white)",
  borderRadius: "14px",
  padding: "22px",
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
};

const thumbBtn: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: 0,
  background: "none",
  cursor: "zoom-in",
  lineHeight: 0,
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "10px",
  fontWeight: 600,
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "10px 12px",
  fontSize: "13px",
  fontFamily: "var(--font-sans)",
  color: "var(--text)",
  outline: "none",
};

const btnPrimary: React.CSSProperties = {
  flex: 1,
  background: "var(--text)",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "11px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};

const btnSecondary: React.CSSProperties = {
  flex: 1,
  background: "none",
  color: "var(--sub)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  padding: "11px",
  fontSize: "13px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
};
