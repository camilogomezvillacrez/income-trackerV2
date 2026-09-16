"use client";

import { useEffect, useState } from "react";

export interface KeyboardViewport {
  /** offsetTop del visualViewport: cuánto ha desplazado Safari la página */
  top: number;
  /** alto visible de verdad, ya descontado el teclado */
  height: number;
}

/**
 * En iOS el teclado no encoge el viewport de layout: un overlay `position: fixed`
 * sigue midiendo la pantalla completa y Safari desplaza el visual viewport, así
 * que el panel se sale por arriba y deja un hueco por debajo.
 *
 * Devuelve las medidas del área realmente visible mientras el teclado está
 * abierto en móvil, y `null` el resto del tiempo (ahí el CSS normal ya sirve).
 */
export function useKeyboardViewport(active: boolean): KeyboardViewport | null {
  const [kb, setKb] = useState<KeyboardViewport | null>(null);

  useEffect(() => {
    if (!active) { setKb(null); return; }
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const update = () => {
      const mobile = window.innerWidth <= 768;
      const hidden = window.innerHeight - vv.height; // alto del teclado
      setKb(mobile && hidden > 100 ? { top: vv.offsetTop, height: vv.height } : null);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);

  return kb;
}
