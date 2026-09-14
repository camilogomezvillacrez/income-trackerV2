import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mis Finanzas",
    short_name: "Finanzas",
    description: "Dashboard de finanzas personales",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F6F2",
    theme_color: "#4A7C59",
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png" }],
  };
}
