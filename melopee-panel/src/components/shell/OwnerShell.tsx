"use client";

import clsx from "clsx";
import {
  CalendarDays,
  ChartColumn,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  Sparkles,
  Store,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppointmentDetail } from "@/components/appointments/AppointmentDetail";
import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { CustomerDrawer } from "@/components/customers/CustomerDrawer";
import { Brand } from "@/components/Brand";
import { Dot, Toaster } from "@/components/ui";
import { formatLong } from "@/lib/dates";
import { initials } from "@/lib/format";
import { useNow } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { useUi } from "@/lib/ui-store";
import type { BranchFilter } from "@/lib/types";

const NAV = [
  { href: "/panel", label: "Genel Bakış", Icon: LayoutDashboard },
  { href: "/panel/randevular", label: "Randevular", Icon: CalendarDays },
  { href: "/panel/subeler", label: "Şubeler", Icon: Store, branches: true },
  { href: "/panel/musteriler", label: "Müşteriler", Icon: Users },
  { href: "/panel/personel", label: "Personel", Icon: UserRound },
  { href: "/panel/finans", label: "Gelir & Gider", Icon: Wallet },
  { href: "/panel/raporlar", label: "Raporlar", Icon: ChartColumn },
  { href: "/panel/hizmetler", label: "Hizmetler", Icon: Sparkles },
  { href: "/panel/ayarlar", label: "Ayarlar", Icon: Settings },
] as const;

export function OwnerShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const navOpen = useUi((s) => s.navOpen);
  const setNav = useUi((s) => s.setNav);
  const pathname = usePathname();

  useEffect(() => {
    if (session?.role !== "owner") router.replace("/");
  }, [session, router]);
  useEffect(() => setNav(false), [pathname, setNav]);

  if (session?.role !== "owner") return null;

  return (
    <div className="min-h-dvh lg:pl-[264px] print:!pl-0">
      <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[300] focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2">
        İçeriğe geç
      </a>
      {/* Masaüstü kenar çubuğu */}
      <aside className="no-print fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-[#fcfaf8] lg:flex">
        <Sidebar />
      </aside>
      {/* Mobil çekmece */}
      {navOpen && (
        <div className="no-print fixed inset-0 z-[80] lg:hidden">
          <div className="anim-fade absolute inset-0 bg-[rgb(42_32_36/0.35)]" onClick={() => setNav(false)} aria-hidden />
          <aside className="anim-slide absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-[#fcfaf8] shadow-[var(--shadow-pop)]" aria-label="Menü">
            <Sidebar />
          </aside>
        </div>
      )}
      <Topbar />
      <main id="icerik" className="print-full mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {children}
      </main>
      <AppointmentForm />
      <AppointmentDetail />
      <CustomerDrawer />
      <Toaster />
    </div>
  );
}

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const branches = useStore((s) => s.branches);
  const branchFilter = useStore((s) => s.branchFilter);
  const setBranchFilter = useStore((s) => s.setBranchFilter);
  const settings = useStore((s) => s.settings);
  const logout = useStore((s) => s.logout);
  const [branchesOpen, setBranchesOpen] = useState(true);

  const isActive = (href: string) => (href === "/panel" ? pathname === "/panel" : pathname.startsWith(href));

  return (
    <>
      <div className="px-6 pb-6 pt-7">
        <Link href="/panel" aria-label="Genel Bakış">
          <Brand size="md" />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-3" aria-label="Ana menü">
        <ul className="flex flex-col gap-0.5">
          {NAV.map(({ href, label, Icon, ...rest }) => {
            const active = isActive(href);
            const hasBranches = "branches" in rest;
            return (
              <li key={href}>
                <div className="flex items-center">
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "flex min-h-[42px] flex-1 items-center gap-3 rounded-[10px] px-3 text-[14.5px] font-semibold transition-colors",
                      active ? "bg-rose-50 text-rose-700" : "text-ink-2 hover:bg-sunk hover:text-ink",
                    )}
                  >
                    <Icon size={18} aria-hidden strokeWidth={active ? 2.3 : 1.9} />
                    {label}
                  </Link>
                  {hasBranches && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon btn-sm ml-1"
                      aria-expanded={branchesOpen}
                      aria-label={branchesOpen ? "Şube listesini gizle" : "Şube listesini göster"}
                      onClick={() => setBranchesOpen((v) => !v)}
                    >
                      <ChevronDown size={16} className={clsx("transition-transform", !branchesOpen && "-rotate-90")} />
                    </button>
                  )}
                </div>
                {hasBranches && branchesOpen && (
                  <ul className="mb-1 ml-[22px] mt-0.5 flex flex-col gap-0.5 border-l border-line pl-3">
                    {[{ id: "all" as BranchFilter, name: "Tüm şubeler", color: "#b5a9ad" }, ...branches].map((b) => {
                      const on = pathname.startsWith("/panel/subeler") && branchFilter === b.id;
                      return (
                        <li key={b.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setBranchFilter(b.id);
                              router.push("/panel/subeler");
                            }}
                            aria-current={on ? "page" : undefined}
                            className={clsx(
                              "flex min-h-[36px] w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left text-[13.5px] font-semibold transition-colors",
                              on ? "bg-surface text-ink shadow-[0_1px_2px_rgb(42_32_36/0.08)]" : "text-ink-2 hover:bg-sunk hover:text-ink",
                            )}
                          >
                            <Dot color={b.color} />
                            <span className="truncate">{b.name}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-line px-4 py-4">
        <div className="flex items-center gap-3 px-2">
          <div className="grid size-9 place-items-center rounded-full bg-rose text-[13px] font-bold text-white" aria-hidden>
            {initials(settings.ownerName || "Y")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold">{settings.ownerName}</p>
            <p className="text-[12px] text-ink-3">Yönetici</p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={logout} aria-label="Çıkış yap" title="Çıkış yap">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </>
  );
}

function Topbar() {
  const branches = useStore((s) => s.branches);
  const branchFilter = useStore((s) => s.branchFilter);
  const setBranchFilter = useStore((s) => s.setBranchFilter);
  const demo = useStore((s) => s.demo);
  const setNav = useUi((s) => s.setNav);
  const openApptForm = useUi((s) => s.openApptForm);
  const focusDate = useUi((s) => s.focusDate);
  const { today } = useNow();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-line bg-[rgb(250_247_244/0.88)] backdrop-blur-md">
      <div className="mx-auto flex min-h-[64px] w-full max-w-[1400px] flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
        <button type="button" className="btn btn-ghost btn-icon -ml-2 lg:hidden" onClick={() => setNav(true)} aria-label="Menüyü aç">
          <Menu size={20} />
        </button>
        <div className="lg:hidden">
          <Brand size="sm" sub="" />
        </div>
        <p className="hidden text-[13.5px] font-semibold text-ink-2 xl:block">{formatLong(today)}</p>
        {demo && <span className="hidden rounded-full bg-[#f6efe2] px-2.5 py-1 text-[11.5px] font-bold text-[#7d5f2e] md:inline">Tanıtım verisi</span>}
        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="branch-switch">
            Şube
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <Dot color={branchFilter === "all" ? "#b5a9ad" : (branches.find((b) => b.id === branchFilter)?.color ?? "#b5a9ad")} />
            </span>
            <select
              id="branch-switch"
              className="input !min-h-[40px] !w-auto !py-1.5 !pl-8 text-[14px] font-semibold"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">Tüm şubeler</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => openApptForm({ branchId: branchFilter === "all" ? undefined : branchFilter, date: focusDate && focusDate >= today ? focusDate : undefined })}>
            <Plus size={17} aria-hidden />
            <span className="hidden sm:inline">Yeni randevu</span>
            <span className="sr-only sm:hidden">Yeni randevu</span>
          </button>
        </div>
      </div>
    </header>
  );
}
