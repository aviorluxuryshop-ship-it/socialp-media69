import { createClient } from "@supabase/supabase-js";
import { aiConfigured } from "./ai";
import { jsonError } from "./http";
import { checkLimit } from "./ratelimit";

export interface Caller {
  id: string;
}

/** Bearer belirtecini Supabase ile doğrular. Yapılandırılmamışsa null döner. */
export async function verifyToken(token: string): Promise<{ id: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id };
}

function clientIp(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "local";
}

/**
 * Tüm yapay zekâ uçlarının girişi: yapılandırma + kimlik + hız sınırı.
 * Anahtarın kötüye kullanılmaması için üretimde oturum zorunludur.
 */
export async function guardAi(req: Request, kind: string): Promise<{ caller: Caller } | { res: Response }> {
  if (!aiConfigured()) {
    return { res: jsonError(503, "ai_unconfigured", "Yapay zekâ bu sürümde henüz etkin değil. Notlar, plan ve video bölümleri yapay zekâ olmadan çalışmaya devam eder.") };
  }
  const supabaseOn = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  let caller: Caller | null = null;
  if (supabaseOn) {
    const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
    const v = token ? await verifyToken(token) : null;
    if (!v) return { res: jsonError(401, "auth_required", "Yapay zekâ özelliklerini kullanmak için giriş yapmalısın.") };
    caller = { id: v.id };
  } else if (process.env.STUDYFLOW_ALLOW_ANON_AI === "1" || process.env.NODE_ENV !== "production") {
    caller = { id: `anon:${clientIp(req)}` };
  } else {
    return { res: jsonError(503, "accounts_unconfigured", "Yapay zekâ, hesap sistemi yapılandırılmadan açılmaz. (Anahtarı korumak için.)") };
  }
  const perDay = Number(process.env.STUDYFLOW_AI_DAILY_LIMIT || 120);
  const lim = checkLimit(`${kind}:${caller.id}`, { perMinute: 12, perDay });
  if (!lim.ok) {
    return {
      res: jsonError(
        429,
        "rate_limited",
        lim.reason === "daily" ? "Bugünkü yapay zekâ kullanım sınırına ulaştın. Yarın tekrar deneyebilirsin." : `Çok hızlı gidiyorsun. ${lim.retryAfterSec} sn sonra tekrar dene.`,
        { retryAfterSec: lim.retryAfterSec },
      ),
    };
  }
  return { caller };
}
