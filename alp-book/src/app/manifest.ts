import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alp Book",
    short_name: "Alp Book",
    description: "Günlük rutinlerini tek tabloda kaydet, ilerlemeni analiz et.",
    start_url: "/takip",
    display: "standalone",
    orientation: "portrait",
    background_color: "#08080a",
    theme_color: "#08080a",
    lang: "tr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
