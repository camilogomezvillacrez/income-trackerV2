"use client";

import { useEffect, useState } from "react";
import { useKeyboardOpen } from "./useKeyboardOpen";

export interface KeyboardViewport {
  /** offsetTop del visualViewport: cuanto ha desplazado Safari la pagina */
  top: number;
  /** alto visible de verdad, ya descontado el teclado */
  height: number;
}

/**
 * Medidas del area visible mientras se escribe, para los overlays que ocupan
 * toda la pantalla (modales, panel del chat).
 *
 * En el navegador de iOS el teclado no encoge el viewport de layout: un overlay
 * position:fixed sigue midiendo la pantalla completa y Safari desplaza el visual
 * viewport, asi que la cabecera se sale por arriba y queda un hueco por debajo.
 *
 * Quien decide si el teclado esta abierto es el foco (ver useKeyboardOpen);
 * visualViewport solo se usa para medir, nunca para detectar.
 */
export function useKeyboardViewport(active: boolean): KeyboardViewport | null {
  const typing = useKeyboardOpen();
  const [kb, setKb] = useState<KeyboardViewport | null>(null);
  const on = active && typing;

  useEffect(() => {
    if (!on) return;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    if (!vv) return;

    const update = () => setKb({ top: vv.offsetTop, height: vv.height });

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [on]);

  // Derivado en vez de reseteado dentro del efecto: al volver a abrirse, el
  // update() inmediato refresca la medida.
  return on ? kb : null;
}
