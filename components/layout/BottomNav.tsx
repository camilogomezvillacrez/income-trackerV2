"use client";

import { useEffect, useState } from "react";

import { Home, ArrowLeftRight, Bot, HandCoins } from "lucide-react";
import { useDashboardStore } from "@/store/dashboardStore";
import type { ViewType } from "@/types";

interface BnItem {
  icon: React.ReactNode;
  iconActive: React.ReactNode;
  label: string;
  view: ViewType;
  id: string;
}

/*
 * Cuatro destinos, no seis: en 390px seis items dejan 65px cada uno y las
 * etiquetas no caben en su casilla. Estos son los de entrada diaria.
 *
 * Metas salio a una tarjeta en el Resumen (MetasCard) y Categorias se alcanza
 * desde el donut de distribucion y las barras por categoria, que ya estaban
 * ahi y no llevaban a ninguna parte.
 */
const ITEMS: BnItem[] = [
  { icon: <Home size={22} strokeWidth={1.8} />,            iconActive: <Home size={22} strokeWidth={2.5} />,            label: "Resumen",      view: "resumen",       id: "bn-resumen" },
  { icon: <ArrowLeftRight size={22} strokeWidth={1.8} />,  iconActive: <ArrowLeftRight size={22} strokeWidth={2.5} />,  label: "Movimientos",  view: "movimientos",   id: "bn-mov"     },
  { icon: <HandCoins size={22} strokeWidth={1.8} />,       iconActive: <HandCoins size={22} strokeWidth={2.5} />,       label: "Deudas",       view: "deudas",        id: "bn-deudas"  },
  { icon: <Bot size={22} strokeWidth={1.8} />,             iconActive: <Bot size={22} strokeWidth={2.5} />,             label: "IA",           view: "asistente",     id: "bn-ia"      },
];

export default function BottomNav() {
  const { view, setView } = useDashboardStore();

  /*
   * Con el teclado abierto la barra se subia: el shell es una columna y, al
   * desplazar iOS la vista para mostrar el campo, la arrastra hacia arriba y
   * acaba flotando sobre el teclado. Mientras se escribe, se retira.
   *
   * Vive aqui dentro a proposito: no toca el alto del body, ni el scroll, ni
   * ninguna otra pantalla.
   */
  const [kbOpen, setKbOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    // Umbral generoso: la barra del navegador tambien cambia vv.height, y solo
    // el teclado se acerca a estos valores.
    const update = () => setKbOpen(window.innerHeight - vv.height > 150);
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  if (kbOpen) return null;

  return (
    <nav
      style={{
        width: "100%",
        height: "68px",
        flexShrink: 0,
        background: "#4A7C59",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        padding: "0 4px",
      }}
    >
      {ITEMS.map((item) => {
        const active = view === item.view;
        return (
          <button
            key={item.id}
            id={item.id}
            onClick={() => setView(item.view)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              padding: "8px 10px",
              borderRadius: "10px",
              cursor: "pointer",
              border: "none",
              background: active ? "rgba(255,255,255,.18)" : "transparent",
              color: active ? "#fff" : "rgba(255,255,255,.75)",
              fontFamily: "var(--font-sans)",
              flex: 1,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {active ? item.iconActive : item.icon}
            <span style={{ fontSize: "9px", fontWeight: active ? 700 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
