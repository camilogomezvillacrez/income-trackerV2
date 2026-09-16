"use client";

import { useEffect } from "react";

/**
 * Cierra el zoom de pellizco.
 *
 * Safari ignora user-scalable=no desde iOS 10, pero si respeta que se cancelen
 * sus eventos de gesto, que son los que disparan el pellizco. El de doble toque
 * lo quita touch-action: manipulation, en globals.css.
 */
export default function NoZoom() {
  useEffect(() => {
    const stop = (e: Event) => e.preventDefault();

    // Eventos propios de WebKit para el pellizco.
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    document.addEventListener("gestureend", stop);

    // Red de seguridad: dos dedos moviendose es siempre un pellizco. Pasivo no,
    // que preventDefault() en un listener pasivo no hace nada.
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener("touchmove", onTouchMove, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", stop);
      document.removeEventListener("gesturechange", stop);
      document.removeEventListener("gestureend", stop);
      document.removeEventListener("touchmove", onTouchMove);
    };
  }, []);

  return null;
}
