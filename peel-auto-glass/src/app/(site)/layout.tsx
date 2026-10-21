import type { ReactNode } from "react";
import { SiteChrome } from "@/components/SiteChrome";
import { StructuredData } from "@/components/StructuredData";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <SiteChrome>
      {children}
      <StructuredData />
    </SiteChrome>
  );
}
