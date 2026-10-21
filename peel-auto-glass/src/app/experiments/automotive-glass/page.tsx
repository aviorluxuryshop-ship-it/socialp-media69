import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { GlassStudy } from "@/experiments/automotive-glass/GlassStudy";
import { checkExperimentAuth } from "@/lib/experiment-auth";

export const metadata: Metadata = {
  title: { absolute: "Automotive Glass Study" },
  description: "Private design experiment.",
  robots: { index: false, follow: false, nocache: true, noarchive: true, nosnippet: true },
};

// Always rendered per request; never prerendered or cached as a static page.
export const dynamic = "force-dynamic";

export default async function AutomotiveGlassExperiment() {
  // Second line of defence behind proxy.ts: the page refuses to render without valid credentials.
  const h = await headers();
  if (checkExperimentAuth(h.get("authorization")) !== "ok") notFound();
  return <GlassStudy />;
}
