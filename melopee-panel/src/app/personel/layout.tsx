"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Brand } from "@/components/Brand";
import { Avatar, Toaster } from "@/components/ui";
import { useStore } from "@/lib/store";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useStore((s) => s.session);
  const staff = useStore((s) => (s.session?.role === "staff" ? s.staff.find((x) => x.id === (s.session as { staffId: string }).staffId) : undefined));
  const branch = useStore((s) => s.branches.find((b) => b.id === staff?.branchId));
  const logout = useStore((s) => s.logout);
  const ok = session?.role === "staff" && staff?.active;

  useEffect(() => {
    if (!ok) {
      if (session?.role === "staff") logout();
      router.replace("/");
    }
  }, [ok, session, logout, router]);

  if (!ok || !staff) return null;
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-[rgb(250_247_244/0.9)] backdrop-blur-md">
        <div className="mx-auto flex min-h-[64px] max-w-[1100px] items-center gap-3 px-4 sm:px-6">
          <Brand size="sm" sub="Personel" />
          <div className="ml-auto flex items-center gap-2.5">
            <Avatar name={staff.name} color={staff.color} size={34} />
            <div className="hidden leading-tight sm:block">
              <p className="text-[14px] font-bold">{staff.name}</p>
              <p className="text-[12px] text-ink-3">{branch?.name}</p>
            </div>
            <button type="button" className="btn btn-ghost btn-icon" onClick={logout} aria-label="Çıkış yap" title="Çıkış yap">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-6 sm:px-6">{children}</main>
      <Toaster />
    </div>
  );
}
