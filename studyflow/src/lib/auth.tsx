"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "./supabase";

export type AuthStatus = "loading" | "signed-out" | "signed-in" | "unconfigured";

interface AuthCtx {
  status: AuthStatus;
  user: User | null;
  /** API çağrıları için erişim belirteci (yalnızca bellekte) */
  getToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signInWithEmail: (email: string, password: string) => Promise<string | null>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  resetPassword: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const TR_ERRORS: Record<string, string> = {
  "Invalid login credentials": "E-posta veya şifre hatalı.",
  "Email not confirmed": "E-posta adresin henüz doğrulanmadı. Gelen kutundaki bağlantıya tıkla.",
  "User already registered": "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.",
  "Password should be at least 6 characters.": "Şifre en az 6 karakter olmalı.",
  "Unable to validate email address: invalid format": "E-posta adresi geçerli görünmüyor.",
  "Signup requires a valid password": "Geçerli bir şifre gir.",
};
const tr = (m: string) => TR_ERRORS[m] ?? (/rate limit/i.test(m) ? "Çok fazla deneme yapıldı. Biraz bekleyip yeniden dene." : "İşlem tamamlanamadı. Lütfen tekrar dene.");

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = supabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const getToken = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const value = useMemo<AuthCtx>(() => {
    const sb = getSupabase();
    const status: AuthStatus = !configured ? "unconfigured" : loading ? "loading" : session ? "signed-in" : "signed-out";
    return {
      status,
      user: session?.user ?? null,
      getToken,
      async signInWithGoogle() {
        if (!sb) return "Hesap sistemi bu sürümde yapılandırılmamış.";
        const { error } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
        return error ? tr(error.message) : null;
      },
      async signInWithEmail(email, password) {
        if (!sb) return "Hesap sistemi bu sürümde yapılandırılmamış.";
        const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password });
        return error ? tr(error.message) : null;
      },
      async signUpWithEmail(email, password) {
        if (!sb) return { error: "Hesap sistemi bu sürümde yapılandırılmamış.", needsConfirmation: false };
        const { data, error } = await sb.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: `${location.origin}/auth/callback` } });
        if (error) return { error: tr(error.message), needsConfirmation: false };
        return { error: null, needsConfirmation: !data.session };
      },
      async resetPassword(email) {
        if (!sb) return "Hesap sistemi bu sürümde yapılandırılmamış.";
        const { error } = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/auth/callback` });
        return error ? tr(error.message) : null;
      },
      async signOut() {
        await sb?.auth.signOut();
      },
    };
  }, [configured, loading, session, getToken]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return v;
}
