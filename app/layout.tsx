import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ServiceWorker from "@/components/common/ServiceWorker";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
