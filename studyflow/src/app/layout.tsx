import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource-variable/newsreader";
import "katex/dist/katex.min.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: { default: "StudyFlow", template: "%s · StudyFlow" },
  description: "Lise öğrencileri için sakin, kaynak dayanaklı yapay zekâ çalışma platformu: öğren, not al, planla, sınavlara hazırlan.",
  applicationName: "StudyFlow",
  manifest: "/manifest.webmanifest",
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#11110f" },
  ],
};

// Tema tercihini boyamadan önce uygular (yanıp sönmeyi önler). Yalnızca cihazdaki bir görünüm tercihidir.
const themeScript = `try{var t=localStorage.getItem('sf-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-raised focus:px-3 focus:py-2">
          İçeriğe geç
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
