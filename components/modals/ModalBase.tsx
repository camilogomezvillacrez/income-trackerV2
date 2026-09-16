"use client";

import { useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import { useKeyboardViewport } from "@/hooks/useKeyboardViewport";

interface Props {
  title: string;
  children: React.ReactNode;
  maxWidth?: number;
  /** Acciones siempre a la vista, fuera del area que se desplaza */
  footer?: React.ReactNode;
}

/**
 * Formulario: pantalla completa en movil, modal centrado en escritorio.
 *
 * En movil no puede ser un recuadro centrado. El body esta clavado a 100svh sin
 * scroll, asi que un overlay centrado no tiene a donde apartarse cuando entra el
 * teclado: se queda del alto de la pantalla, iOS desplaza la vista y la cabecera
 * acaba fuera. A pantalla completa el formulario manda sobre su propio alto y
 * desplaza su contenido por dentro, que es lo que hace cualquier app nativa.
 *
 * En escritorio no hay teclado que estorbe y un formulario suelto se ve vacio,
 * asi que ahi se queda el modal de siempre.
 */
export default function ModalBase({ title, children, maxWidth = 480, footer }: Props) {
  const closeModal = useDashboardStore((s) => s.closeModal);
  const kb = useKeyboardViewport(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="sheet-root"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
    >
      {/* La lamina cubre siempre toda la pantalla y es opaca: si se encoge al
          area visible, entre el pie y las teclas se cuela la pantalla de atras,
          y el teclado de iOS es translucido y la refleja. Quien se cine al area
          visible es la tarjeta, para que el pie quede justo sobre el teclado. */}
      <div
        className="sheet-card"
        style={
          kb
            ? { maxWidth, position: "absolute", top: kb.top, left: 0, right: 0, height: kb.height }
            : { maxWidth }
        }
      >
        <div className="sheet-head">
          <button onClick={closeModal} className="sheet-back" aria-label="Volver">
            <ChevronLeft size={24} />
          </button>
          <h3 className="sheet-title">{title}</h3>
          <button onClick={closeModal} className="sheet-close" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}
