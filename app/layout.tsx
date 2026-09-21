import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/common/ServiceWorker";
import NoZoom from "@/components/common/NoZoom";

// Instanciada aqui y solo aqui: hacerlo en otro componente duplica la descarga.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

// Los montos usan la fuente del sistema (ver --font-mono en globals.css):
// no se descarga ninguna fuente monoespaciada.

/*
 * Pantallas de arranque de iOS: sin ellas la app agregada al inicio abre en
 * blanco mientras llega el HTML. Una por tamaño de iPhone (ancho x alto en
 * puntos @ densidad); iOS solo usa la que coincide exactamente con el equipo.
 * Se generan desde public/logo.png sobre el mismo fondo del splash.
 */
const SPLASH_SIZES: [number, number, number][] = [
  [440, 956, 3], [420, 912, 3], [402, 874, 3], [430, 932, 3],
  [393, 852, 3], [428, 926, 3], [390, 844, 3], [375, 812, 3],
  [414, 896, 3], [414, 896, 2], [414, 736, 3], [375, 667, 2],
];

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "Dashboard de finanzas personales",
  appleWebApp: {
    capable: true,
    title: "Mis Finanzas",
    statusBarStyle: "default",
    startupImage: SPLASH_SIZES.map(([w, h, d]) => ({
      url: `/splash/${w}x${h}@${d}x.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${d}) and (orientation: portrait)`,
    })),
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${plexSans.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ServiceWorker />
        <NoZoom />
      </body>
    </html>
  );
}
