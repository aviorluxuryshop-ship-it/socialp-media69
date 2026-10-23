import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Gizli bilgi içermez: yalnızca hangi özelliklerin yapılandırıldığını söyler. */
export async function GET() {
  const ai = Boolean(process.env.ANTHROPIC_API_KEY);
  const accounts = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  // Anahtarı korumak için üretimde yapay zekâ yalnızca hesap sistemi varsa (veya açıkça izin verildiyse) açılır
  const aiReady = ai && (accounts || process.env.NODE_ENV !== "production" || process.env.STUDYFLOW_ALLOW_ANON_AI === "1");
  return NextResponse.json({ ai, accounts, aiReady }, { headers: { "Cache-Control": "no-store" } });
}
