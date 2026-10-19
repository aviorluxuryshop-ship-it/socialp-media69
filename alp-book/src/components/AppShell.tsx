"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { BarChart3, GraduationCap, LayoutDashboard, Settings, Table2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./Onboarding";

const NAV = [
  { href: "/", label: "Özet", icon: LayoutDashboard },
  { href: "/takip", label: "Takip", icon: Table2 },
  { href: "/analiz", label: "Analiz", icon: BarChart3 },
  { href: "/exams", label: "Sınavlar", icon: GraduationCap },
  { href: "/settings", label: "Ayarlar", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const onboarded = useStore((s) => s.profile.onboarded);
  const path = usePathname();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Depolama engelliyse (özel sekme vb.) sonsuza kadar bekleme.
    const t = setTimeout(() => setTimedOut(true), 1500);
    const ready = () => useStore.setState({ hydrated: true });
    if (useStore.persist.hasHydrated()) ready();
    const off = useStore.persist.onFinishHydration(ready);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    return () => {
      clearTimeout(t);
      off();
    };
  }, []);

  if (!hydrated && !timedOut) return <Splash />;
  if (!onboarded) return <Onboarding />;

  const isOn = (href: string) => (href === "/" ? path === "/" : path.startsWith(href));

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1480px]">
      <aside className="sticky top-0 hidden h-dvh w-[232px] shrink-0 flex-col border-r border-line px-4 py-7 md:flex">
        <Link href="/" className="mb-9 flex items-center gap-2.5 px-3">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-line-2 bg-raised text-[13px] font-bold text-accent">A</span>
          <span className="text-[15px] font-semibold tracking-tight">Alp Book</span>
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Ana menü">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={isOn(n.href) ? "page" : undefined}
              className={clsx("relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors", isOn(n.href) ? "text-text" : "text-mute hover:text-text")}
            >
              {isOn(n.href) && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-[10px] bg-raised" transition={{ duration: 0.2 }} />}
              <n.icon size={17} className={clsx("relative", isOn(n.href) && "text-accent")} />
              <span className="relative">{n.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 safe-top md:px-8 md:pb-12 md:pt-9">{children}</main>

      <nav aria-label="Ana menü" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 backdrop-blur-xl md:hidden safe-bottom">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isOn(n.href) ? "page" : undefined} className={clsx("flex min-h-[52px] flex-col items-center justify-center gap-1 text-[10px] font-medium", isOn(n.href) ? "text-accent" : "text-faint")}>
              <n.icon size={20} />
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <motion.p className="text-lg font-semibold tracking-tight text-mute" animate={{ opacity: [0.35, 1, 0.35] }} transition={{ repeat: Infinity, duration: 1.6 }}>
        Alp Book
      </motion.p>
    </div>
  );
}
