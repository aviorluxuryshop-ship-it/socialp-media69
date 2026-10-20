"use client";

import { Cloud, CloudOff, LogOut, RefreshCw } from "lucide-react";
import { cloudConfigured, signInWithGoogle, signOutCloud, syncNow, useCloud } from "@/lib/cloud";
import { SectionHead } from "./ui";

export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

const time = (t: number) => new Date(t).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function AccountCard() {
  const { status, user, lastSync, error } = useCloud();
  const busy = status === "connecting" || status === "syncing";

  return (
    <section className="panel p-5 sm:p-6" aria-labelledby="acc">
      <SectionHead title="Hesap ve eşitleme" />
      {!cloudConfigured ? (
        <div className="rounded-xl border border-dashed border-line-2 px-4 py-4 text-[13px] leading-relaxed text-mute">
          <p className="mb-1 flex items-center gap-2 font-medium text-text"><CloudOff size={15} /> Google girişi henüz kurulmadı</p>
          Veriler şu an yalnızca bu cihazda duruyor. Hesapla eşitlemeyi açmak için Firebase projesi bağlanmalı (ücretsiz). Kurulum adımları depodaki <code className="rounded bg-raised px-1.5 py-0.5 text-[12px] text-text">alp-book/README.md</code> dosyasında.
        </div>
      ) : !user ? (
        <>
          <p id="acc" className="mb-4 text-[13px] leading-relaxed text-mute">
            Google ile giriş yapınca kayıtların, planların ve ayarların hesabına yedeklenir; telefon ve bilgisayarda aynı veriyi görürsün. Giriş yapmadan da uygulama bu cihazda çalışmaya devam eder.
          </p>
          <button type="button" className="btn btn-quiet" disabled={busy} onClick={() => void signInWithGoogle()}>
            <GoogleMark /> {busy ? "Bağlanıyor…" : "Google ile giriş yap"}
          </button>
          {status === "error" && error && <p role="alert" className="mt-3 text-[13px] text-rose">{error}</p>}
        </>
      ) : (
        <>
          <div className="flex items-center gap-3">
            {user.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photo} alt="" width={40} height={40} referrerPolicy="no-referrer" className="h-10 w-10 rounded-full border border-line-2" />
            ) : (
              <span className="grid h-10 w-10 place-items-center rounded-full border border-line-2 bg-raised text-sm font-semibold">{(user.name || user.email || "?").slice(0, 1).toUpperCase()}</span>
            )}
            <div className="min-w-0">
              <p id="acc" className="truncate text-[14px] font-medium">{user.name || "Google hesabı"}</p>
              <p className="truncate text-[12px] text-mute">{user.email}</p>
            </div>
          </div>
          <p role="status" className={`mt-4 flex items-center gap-2 text-[13px] ${status === "error" ? "text-rose" : "text-mute"}`}>
            {status === "error" ? <CloudOff size={15} /> : <Cloud size={15} className={status === "synced" ? "text-accent" : ""} />}
            {status === "error" ? error : busy ? "Eşitleniyor…" : `Eşitlendi${lastSync ? ` · ${time(lastSync)}` : ""}`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-quiet btn-sm" disabled={busy} onClick={() => void syncNow()}>
              <RefreshCw size={14} /> Şimdi eşitle
            </button>
            <button type="button" className="btn btn-quiet btn-sm" onClick={() => void signOutCloud()}>
              <LogOut size={14} /> Çıkış yap
            </button>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-faint">Çıkış yapınca bu cihazdaki veriler silinmez; yalnızca eşitleme durur.</p>
        </>
      )}
    </section>
  );
}
