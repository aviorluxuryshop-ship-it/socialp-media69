import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyFlow",
    short_name: "StudyFlow",
    description: "Lise öğrencileri için kaynak dayanaklı çalışma platformu",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f3ec",
    theme_color: "#2f5d50",
    lang: "tr",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
