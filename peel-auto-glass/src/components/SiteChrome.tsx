import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Header } from "./Header";

/** Skip link + header + main landmark + footer, shared by every public page. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-ink focus:shadow-lg"
      >
        Skip to main content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}
