"use client";

import clsx from "clsx";
import { Cloud, CloudOff, Menu, Moon, Sun, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { useStoreCtx } from "@/lib/store/provider";
import { Wordmark } from "./Logo";
import { NAV, isActive } from "./nav";
import { Sheet, Skeleton, ToastHost } from "./ui";

const PUBLIC = ["/giris", "/auth/callback", "/hos-geldin"];

function SyncPill() {
  const { sync, syncError, store } = useStoreCtx();
  const auth = useAuth();
  if (auth.status === "signed-in") {
    if (sync === "error")
      return (
        <span className="badge badge-warn" title={syncError ?? undefined}>
          <TriangleAlert size={13} /> Kaydedilemedi
        </span>
      );
    return (
      <span className="badge" title="Verilerin hesabında saklanıyor">
        <Cloud size={13} /> {sync === "saving" ? "Kaydediliyor…" : "Hesapta"}
      </span>
    );
  }
  void store;
  return (
    <span className="badge" title="Veriler yalnızca bu tarayıcıda saklanıyor">
      <CloudOff size={13} /> Bu cihazda
    </span>
  );
}

function AccountLink() {
  const auth = useAuth();
  const href = auth.status === "signed-out" ? "/giris" : "/ayarlar";
  const initial = auth.user?.email?.[0]?.toLocaleUpperCase("tr-TR");
  return (
    <Link
      href={href}
      className="btn btn-ghost btn-sm gap-2"
      aria-label={auth.status === "signed-in" ? "Hesap ve ayarlar" : auth.status === "signed-out" ? "Giriş yap" : "Ayarlar"}
    >
      {initial ? <span className="grid h-6 w-6 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">{initial}</span> : null}
      <span className="hidden sm:inline">{auth.status === "signed-out" ? "Giriş yap" : auth.status === "signed-in" ? "Hesabım" : "Ayarlar"}</span>
    </Link>
  );
}

function subscribeScheme(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function ThemeToggle() {
  const { profile, patchProfile } = useApp();
  const theme = profile?.theme ?? "system";
  const dark = useSyncExternalStore(
    subscribeScheme,
    () => theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches),
    () => false,
  );
  return (
    <button
      className="btn btn-ghost btn-icon btn-sm"
      aria-label={dark ? "Açık temaya geç" : "Koyu temaya geç"}
      onClick={() => void patchProfile({ theme: dark ? "light" : "dark" })}
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, profileLoading } = useApp();
  const [more, setMore] = useState(false);
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + "/"));

  useEffect(() => {
    if (!profileLoading && !profile && !isPublic) router.replace("/hos-geldin");
  }, [profileLoading, profile, isPublic, router]);
  // Sayfa değişince "Daha fazla" sayfası kapansın (render sırasında ayarlanır, efekt gerekmez)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMore(false);
  }

  if (isPublic) {
    return (
      <>
        <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-5 py-8 sm:py-12">
          <div className="mb-8">
            <Wordmark />
          </div>
          <div className="flex-1">{children}</div>
        </div>
        <ToastHost />
      </>
    );
  }

  if (profileLoading || !profile) {
    return (
      <div className="mx-auto max-w-[1040px] space-y-4 px-6 py-12" aria-busy>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const bar = NAV.filter((n) => n.bar);
  const rest = NAV.filter((n) => !n.bar);
  const moreActive = rest.some((n) => isActive(pathname, n.href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[264px_minmax(0,1fr)]">
      {/* Masaüstü kenar çubuğu */}
      <aside className="no-print sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/60 px-4 py-6 lg:flex">
        <Link href="/" className="mb-8 px-2" aria-label="StudyFlow ana sayfa">
          <Wordmark />
        </Link>
        <nav aria-label="Ana gezinme" className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV.filter((n) => n.group === "main").map((n) => (
            <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
          ))}
          <p className="eyebrow px-3 pb-1 pt-6">Düzen</p>
          {NAV.filter((n) => n.group === "more").map((n) => (
            <NavLink key={n.href} item={n} active={isActive(pathname, n.href)} />
          ))}
        </nav>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-4">
          <SyncPill />
          <div className="flex items-center">
            <ThemeToggle />
            <AccountLink />
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobil üst çubuk */}
        <div className="glass no-print sticky top-0 z-30 flex items-center justify-between border-b border-line px-4 py-2.5 lg:hidden">
          <Link href="/" aria-label="StudyFlow ana sayfa">
            <Wordmark size={24} />
          </Link>
          <div className="flex items-center gap-1">
            <SyncPill />
            <ThemeToggle />
            <AccountLink />
          </div>
        </div>
        <main id="icerik" className="mx-auto w-full max-w-[1040px] px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-20 lg:pt-12">
          <div key={pathname} className="anim-rise">
            {children}
          </div>
        </main>
      </div>

      {/* Mobil alt gezinme */}
      <nav aria-label="Ana gezinme" className="glass no-print safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line lg:hidden">
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pt-1.5">
          {bar.map((n) => {
            const on = isActive(pathname, n.href);
            const Icon = n.icon;
            return (
              <li key={n.href} className="flex-1">
                <Link
                  href={n.href}
                  aria-current={on ? "page" : undefined}
                  className={clsx("flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors", on ? "text-accent" : "text-ink-3")}
                >
                  <Icon size={21} strokeWidth={on ? 2.2 : 1.8} />
                  {n.short}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setMore(true)}
              aria-haspopup="dialog"
              className={clsx("flex w-full flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-medium transition-colors", moreActive ? "text-accent" : "text-ink-3")}
            >
              <Menu size={21} strokeWidth={moreActive ? 2.2 : 1.8} />
              Daha fazla
            </button>
          </li>
        </ul>
      </nav>

      <Sheet open={more} onClose={() => setMore(false)} title="Tüm bölümler">
        <ul className="grid grid-cols-2 gap-2.5">
          {NAV.filter((n) => !n.bar || n.group === "more").map((n) => {
            const Icon = n.icon;
            return (
              <li key={n.href}>
                <Link href={n.href} className="card flex items-center gap-3 px-4 py-3.5 text-[0.95rem] font-medium text-ink">
                  <Icon size={20} className="text-accent" />
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Sheet>
      <ToastHost />
    </div>
  );
}

function NavLink({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium transition-colors",
        active ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
      )}
    >
      <Icon size={19} strokeWidth={active ? 2.2 : 1.8} />
      {item.label}
    </Link>
  );
}
