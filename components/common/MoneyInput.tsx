"use client";

import { fmtMiles } from "@/lib/utils";

interface Props {
  /** Texto ya formateado, tal cual se ve: "1.250.000" */
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  autoFocus?: boolean;
}

/**
 * Campo de pesos: pone los puntos de miles mientras se escribe y deja en el
 * estado ese mismo texto ya formateado, para que lo que se ve y lo que se
 * guarda sean lo mismo. Al enviar, parseMiles() lo devuelve a numero.
 *
 * Va como type="text": type="number" no admite los puntos, los da por invalido
 * y devuelve value vacio.
 */
export default function MoneyInput({ value, onChange, placeholder, style, autoFocus }: Props) {
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(fmtMiles(e.target.value))}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={style}
    />
  );
}
