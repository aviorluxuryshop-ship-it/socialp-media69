"use client";

import { motion } from "framer-motion";
import { GraduationCap, Grid3x3, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Onboarding } from "./Onboarding";

const NAV = [
  { href: "/", label: "Bugün", icon: LayoutDashboard },
  { href: "/matrix", label: "Matris", icon: Grid3x3 },
  { href: "/exams", label: "Dersler", icon: GraduationCap },
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

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px]">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line px-4 py-8 md:flex">
        <p className="mb-10 px-3 font-mono text-lg font-bold tracking-[0.3em] text-neon text-glow">ALP BOOK</p>
        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className="relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors" style={{ color: on ? "#00ff66" : "#8b8b93" }}>
                {on && <motion.span layoutId="side-pill" className="absolute inset-0 rounded-xl border border-neon/30 bg-neon/10" />}
                <n.icon size={18} className="relative" />
                <span className="relative">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 safe-top md:px-8 md:pb-10 md:pt-8">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-black/85 backdrop-blur-xl md:hidden safe-bottom">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map((n) => {
            const on = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href} className="flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold" style={{ color: on ? "#00ff66" : "#6b6b73" }}>
                <n.icon size={21} style={on ? { filter: "drop-shadow(0 0 6px #00ff66)" } : undefined} />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <motion.p className="font-mono text-xl font-bold tracking-[0.35em] text-neon text-glow" animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.4 }}>
        ALP BOOK
      </motion.p>
    </div>
  );
}
