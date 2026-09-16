"use client";

import { fmtMiles } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Tine el numero segun sea ingreso o gasto */
  color?: string;
  autoFocus?: boolean;
}

/**
 * El monto como protagonista de la pantalla: cifra grande, centrada y enfocada
 * al entrar, para que el teclado numerico se abra solo y se pueda teclear sin
 * apuntar a nada. El resto del formulario queda debajo.
 *
 * inputMode="numeric" sobre type="text": pide el teclado de numeros pero deja
 * escribir los puntos de miles, que type="number" da por invalido.
 */
export default function AmountHero({ value, onChange, color = "var(--text)", autoFocus }: Props) {
  return (
    <div className="hero">
      <span className="hero-sign">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(fmtMiles(e.target.value))}
        placeholder="0"
        autoFocus={autoFocus}
        aria-label="Monto"
        className="hero-input"
        style={{ color: value ? color : "var(--border)" }}
        // El ancho sigue a la cifra para que quede centrada junto al signo
        size={Math.max(value.length || 1, 1)}
      />
    </div>
  );
}
