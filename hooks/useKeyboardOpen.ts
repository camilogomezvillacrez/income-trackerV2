"use client";

import { useEffect, useState } from "react";

// Tipos de input que no abren teclado.
const SIN_TECLADO = new Set([
  "button", "submit", "reset", "checkbox", "radio",
  "range", "color", "file", "image",
]);

function abreTeclado(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !SIN_TECLADO.has(el.type);
  return false;
}

/**
 * Dice si el teclado esta abierto, mirando el foco y no el tamano de la ventana.
 *
 * Medir no sirve: instalada en la pantalla de inicio la ventana se encoge junto
 * con el teclado, asi que innerHeight y visualViewport.height bajan a la vez y
 * su diferencia no delata nada; y en el navegador ese tamano tambien cambia al
 * desplazarse, con lo que el teclado se daria por abierto mientras se lee. Que
 * haya un campo de texto enfocado si es inequivoco.
 *
 * De paso centra el campo enfocado: las teclas ocupan media pantalla y si no
 * se sube, se escribe a ciegas.
 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onIn = (e: FocusEvent) => {
      const el = e.target as Element;
      if (!abreTeclado(el)) return;
      setOpen(true);
      // Tras el layout que provoca abrir el teclado, no antes.
      setTimeout(() => {
        (el as HTMLElement).scrollIntoView({ block: "center", behavior: "smooth" });
      }, 100);
    };

    const onOut = () => {
      // El foco viaja de un campo a otro pasando por el body: se comprueba
      // despues, ya con el foco asentado.
      setTimeout(() => setOpen(abreTeclado(document.activeElement)), 0);
    };

    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);

  return open;
}
