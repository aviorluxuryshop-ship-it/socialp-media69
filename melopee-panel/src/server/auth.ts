// Oturum çerezi (HMAC imzalı), şifre özeti ve hatalı giriş kilidi.
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import type { Session, Staff } from "@/lib/types";
import { DbNotConfigured, getDb, type Db } from "./db";

const COOKIE = "mp_s";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 gün

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.VERCEL) throw new Error("SESSION_SECRET ortam değişkeni eksik.");
  return "dev-only-session-secret-change-me";
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const sign = (body: string) => b64(createHmac("sha256", secret()).update(body).digest());

interface Payload {
  r: "o" | "s";
  s?: string;
  e: number;
}

export function readSession(req: NextRequest): Session {
  const raw = req.cookies.get(COOKIE)?.value;
  if (!raw) return null;
  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString()) as Payload;
    if (p.e < Date.now()) return null;
    if (p.r === "o") return { role: "owner" };
    if (p.r === "s" && p.s) return { role: "staff", staffId: p.s };
  } catch {
    /* bozuk çerez */
  }
  return null;
}

export function setSession(res: NextResponse, s: NonNullable<Session>) {
  const p: Payload = { r: s.role === "owner" ? "o" : "s", s: s.role === "staff" ? s.staffId : undefined, e: Date.now() + MAX_AGE * 1000 };
  const body = b64(JSON.stringify(p));
  res.cookies.set(COOKIE, `${body}.${sign(body)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE });
}

export function clearSession(res: NextResponse) {
  res.cookies.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* ───────── Şifreler ───────── */

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  return `scrypt$${salt.toString("hex")}$${scryptSync(pw, salt, 32).toString("hex")}`;
}

function verifyHash(pw: string, stored: string): boolean {
  const [alg, salt, hash] = stored.split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const a = scryptSync(pw, Buffer.from(salt, "hex"), 32);
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function checkOwnerPassword(db: Db, pw: string): Promise<boolean> {
  const stored = await db.authGet<{ hash: string }>("owner");
  if (stored?.hash) return verifyHash(pw, stored.hash);
  const env = process.env.OWNER_PASSWORD || (process.env.VERCEL ? "" : "melopee");
  return !!env && safeEqual(pw, env);
}

export function checkStaffPin(staff: Staff | null, pin: string): boolean {
  return !!staff && staff.active && !!staff.pin && safeEqual(pin, staff.pin);
}

/* ───────── Hatalı giriş kilidi ───────── */

const MAX_FAILS = 8;
const WINDOW_MS = 15 * 60 * 1000;

interface Fails {
  count: number;
  first: number;
  lockedUntil: number;
}

export async function lockedFor(db: Db, who: string): Promise<number> {
  const f = await db.authGet<Fails>(`fail:${who}`);
  return f && f.lockedUntil > Date.now() ? Math.ceil((f.lockedUntil - Date.now()) / 60000) : 0;
}

export async function recordFail(db: Db, who: string) {
  const now = Date.now();
  const f = (await db.authGet<Fails>(`fail:${who}`)) ?? { count: 0, first: now, lockedUntil: 0 };
  const fresh = now - f.first > WINDOW_MS ? { count: 0, first: now, lockedUntil: 0 } : f;
  fresh.count++;
  if (fresh.count >= MAX_FAILS) fresh.lockedUntil = now + WINDOW_MS;
  await db.authSet(`fail:${who}`, fresh);
}

export async function clearFails(db: Db, who: string) {
  await db.authDel(`fail:${who}`);
}

/* ───────── Ortak yanıt yardımcıları ───────── */

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

export function fail(message: string, status: number) {
  return json({ error: message }, status);
}

/** Tarayıcıdan gelmeyen (form/başka site) yazma isteklerini reddeder. */
export function badOrigin(req: NextRequest): boolean {
  return req.headers.get("x-mp") !== "1";
}

type Handler = (ctx: { req: NextRequest; db: Db; session: Session }) => Promise<NextResponse>;

/** Veritabanı ve oturumu hazırlar; staff oturumu artık geçerli değilse (silinmiş/pasif) düşürür. */
export function route(h: Handler, opts: { write?: boolean } = {}) {
  return async (req: NextRequest) => {
    try {
      if (opts.write && badOrigin(req)) return fail("Geçersiz istek.", 400);
      const db = getDb();
      let session = readSession(req);
      if (session?.role === "staff") {
        const st = await db.get<Staff>("staff", session.staffId);
        if (!st?.active) session = null;
      }
      return await h({ req, db, session });
    } catch (e) {
      if (e instanceof DbNotConfigured) return fail(e.message, 503);
      console.error(e);
      return fail("Sunucuda bir hata oluştu. Lütfen tekrar deneyin.", 500);
    }
  };
}
