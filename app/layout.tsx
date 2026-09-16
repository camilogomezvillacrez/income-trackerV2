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

export const metadata: Metadata = {
  title: "Mis Finanzas",
  description: "Dashboard de finanzas personales",
  appleWebApp: { capable: true, title: "Mis Finanzas", statusBarStyle: "default" },
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
