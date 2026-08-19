"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/store/dashboardStore";
import { currentMonth } from "@/lib/utils";

/** Debe coincidir con SESSION_IDLE_MS en lib/auth.ts */
const IDLE_MS = 5 * 60 * 1000;

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"];

/** Última interacción real del usuario (no cuenta el sondeo automático). */
let lastInteraction = Date.now();

export function useDashboard() {
  const { refresh, activeMonth } = useDashboardStore();

  // Recarga cuando cambia el mes seleccionado
  useEffect(() => {
    refresh();
  }, [activeMonth]);

  // Auto-refresco cada 60 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      // Si el usuario tocó algo en el último minuto, el sondeo cuenta como
      // actividad y renueva la sesión; si no, va marcado como background.
      const active = Date.now() - lastInteraction < 60_000;
      useDashboardStore.getState().refresh(!active);
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── Cierre de sesión por inactividad ────────────────────────
  useEffect(() => {
    const touch = () => { lastInteraction = Date.now(); };

    async function logout() {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
      } catch {
        // Sin red: igual sacamos al usuario de la pantalla
      }
      window.location.href = "/login";
    }

    function check() {
      if (Date.now() - lastInteraction >= IDLE_MS) logout();
    }

    // Al volver a la pestaña/app se comprueba de inmediato
    const onVisibility = () => {
      if (document.visibilityState === "visible") check();
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, touch, { passive: true })
    );
    document.addEventListener("visibilitychange", onVisibility);

    const interval = setInterval(check, 15_000);

    return () => {
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(interval);
    };
  }, []);

  // Detecta cambio de mes calendario → avanza automáticamente
  // Solo si el usuario está viendo el mes que acaba de terminar
  useEffect(() => {
    const check = () => {
      const cm = currentMonth();
      const { activeMonth, lastKnownMonth, setMonth } = useDashboardStore.getState();

      if (cm !== lastKnownMonth) {
        // Nuevo mes detectado
        useDashboardStore.setState({ lastKnownMonth: cm });

        // Avanzar solo si el usuario estaba en el mes anterior (no navegando historial)
        if (activeMonth === lastKnownMonth) {
          setMonth(cm);
        }
      }
    };

    // Verificar cada 30 segundos (relevante cerca del cambio de mes)
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, []);
}
