"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Field, Notice, Spinner } from "@/components/ui";
import { useAuth } from "@/lib/auth";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function LoginInner() {
  const auth = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"in" | "up">(params.get("kayit") ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (auth.status === "signed-in") router.replace("/");
  }, [auth.status, router]);

  if (auth.status === "unconfigured") {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl text-ink">Hesap henüz etkin değil</h1>
        <Notice tone="info" title="Bu sürümde hesap sistemi yapılandırılmamış">
          Giriş ve bulut eşitleme, sunucuda Supabase bağlantısı tanımlandığında açılır. O zamana kadar StudyFlow&apos;u hesapsız kullanabilirsin; notların, planın ve sınav
          sonuçların yalnızca bu tarayıcıda saklanır.
        </Notice>
        <Link href="/" className="btn btn-primary">
          Hesapsız devam et
        </Link>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    if (mode === "in") {
      const err = await auth.signInWithEmail(email, password);
      if (err) setError(err);
    } else {
      const r = await auth.signUpWithEmail(email, password);
      if (r.error) setError(r.error);
      else if (r.needsConfirmation) setInfo("Hesabını oluşturduk. E-postana gelen doğrulama bağlantısına tıkladıktan sonra giriş yapabilirsin.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-7">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft size={16} /> Geri
      </Link>
      <div>
        <h1 className="font-display text-[2rem] leading-tight text-ink">{mode === "in" ? "Tekrar hoş geldin" : "Hesap oluştur"}</h1>
        <p className="mt-2 text-ink-2">Hesap, notlarını ve planını güvenle saklar ve cihazlar arasında eşitler. Verilerini yalnızca sen görürsün.</p>
      </div>

      <button
        className="btn btn-secondary w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const err = await auth.signInWithGoogle();
          if (err) {
            setError(err);
            setBusy(false);
          }
        }}
      >
        <GoogleG /> Google ile devam et
      </button>

      <div className="flex items-center gap-3 text-xs text-ink-3">
        <span className="h-px flex-1 bg-line" /> veya e-posta ile <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="E-posta" htmlFor="email">
          <input id="email" type="email" autoComplete="email" required className="field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@eposta.com" />
        </Field>
        <Field label="Şifre" htmlFor="password" hint={mode === "up" ? "En az 6 karakter." : undefined}>
          <input
            id="password"
            type="password"
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            required
            minLength={6}
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <Notice tone="error">{error}</Notice>}
        {info && <Notice tone="ok">{info}</Notice>}
        <button className="btn btn-primary w-full" disabled={busy || !email || password.length < 6}>
          {busy ? <Spinner /> : <Mail size={18} />} {mode === "in" ? "Giriş yap" : "Hesap oluştur"}
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <button className="text-accent underline-offset-4 hover:underline" onClick={() => { setMode(mode === "in" ? "up" : "in"); setError(null); setInfo(null); }}>
          {mode === "in" ? "Hesabın yok mu? Oluştur" : "Zaten hesabın var mı? Giriş yap"}
        </button>
        {mode === "in" && (
          <button
            className="text-ink-3 underline-offset-4 hover:text-ink hover:underline"
            onClick={async () => {
              if (!email) return setError("Önce e-posta adresini yaz.");
              const err = await auth.resetPassword(email);
              if (err) setError(err);
              else setInfo("Şifre sıfırlama bağlantısı e-postana gönderildi.");
            }}
          >
            Şifremi unuttum
          </button>
        )}
      </div>
      <p className="text-center text-sm text-ink-3">
        <Link href="/" className="underline-offset-4 hover:underline">
          Hesapsız devam et
        </Link>{" "}
        — veriler yalnızca bu tarayıcıda kalır.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
