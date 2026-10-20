"use client";

import { create } from "zustand";
import { mergeData, monthOfDate, splitMonths, toMeta, type MetaDoc } from "./merge";
import { emptyData, normalizeData } from "./normalize";
import { snapshot, useStore } from "./store";
import type { AppData, DayEntry } from "./types";

/**
 * Google ile giriş + Firestore eşitleme (Firebase). Ortam değişkenleri yoksa uygulama yalnızca
 * yerel (cihaz) depolamayla çalışmaya devam eder. Firebase kütüphanesi ancak gerektiğinde yüklenir.
 *
 * Bulutta düzen:  users/{uid}/meta/main  → profil adı, hedefler, planlar, sınavlar
 *                 users/{uid}/months/{YYYY-AA} → o ayın günlük kayıtları
 */

const env = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  /** Yalnızca geliştirme/test: Firebase emülatörlerine bağlanır. */
  emulator: process.env.NEXT_PUBLIC_FIREBASE_EMULATOR === "1",
};
export const cloudConfigured = Boolean(env.apiKey && env.projectId && env.appId);

export type CloudStatus = "off" | "idle" | "connecting" | "syncing" | "synced" | "error";
export interface CloudUser {
  uid: string;
  name: string;
  email: string;
  photo: string | null;
}

export const useCloud = create<{ status: CloudStatus; user: CloudUser | null; lastSync: number | null; error: string | null }>(() => ({
  status: cloudConfigured ? "idle" : "off",
  user: null,
  lastSync: null,
  error: null,
}));
const set = useCloud.setState;

const FLAG = "alpbook:cloud";
const DEVICE_KEY = "alpbook:device";

const lsGet = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const lsSet = (k: string, v: string | null) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* yoksay */
  }
};
const deviceId = () => {
  let id = lsGet(DEVICE_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    lsSet(DEVICE_KEY, id);
  }
  return id;
};

type Sdk = Awaited<ReturnType<typeof loadSdk>>;
let sdkP: Promise<Sdk> | null = null;
async function loadSdk() {
  const [app, auth, fs] = await Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore")]);
  const a = app.getApps()[0] ?? app.initializeApp({ apiKey: env.apiKey, authDomain: env.authDomain || `${env.projectId}.firebaseapp.com`, projectId: env.projectId, appId: env.appId });
  const authInst = auth.getAuth(a);
  const db = fs.getFirestore(a);
  if (env.emulator) {
    auth.connectAuthEmulator(authInst, "http://127.0.0.1:9099", { disableWarnings: true });
    fs.connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return { auth, fs, authInst, db };
}
const sdk = () => (sdkP ??= loadSdk());

// ---- oturum durumu ----
let attached = false;
let stopSync: (() => void) | null = null;

/** Uygulama açılırken: daha önce giriş yapıldıysa oturumu geri yükler. */
export function initCloud() {
  if (!cloudConfigured) return;
  if (lsGet(FLAG) === "1") void attach();
}

async function attach() {
  if (attached) return;
  attached = true;
  try {
    const { auth, authInst } = await sdk();
    auth.onAuthStateChanged(authInst, (u) => {
      if (!u) {
        stopSync?.();
        stopSync = null;
        set({ status: "idle", user: null });
        return;
      }
      const user: CloudUser = { uid: u.uid, name: u.displayName ?? "", email: u.email ?? "", photo: u.photoURL };
      set({ user, status: "connecting", error: null });
      void startSync(user);
    });
  } catch (e) {
    attached = false;
    fail(e);
  }
}

export async function signInWithGoogle() {
  if (!cloudConfigured) return;
  set({ status: "connecting", error: null });
  try {
    const { auth, authInst } = await sdk();
    lsSet(FLAG, "1");
    await attach();
    const provider = new auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await auth.signInWithPopup(authInst, provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        set({ status: useCloud.getState().user ? "synced" : "idle" });
        return;
      }
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await auth.signInWithRedirect(authInst, provider); // iPhone ana ekran uygulaması gibi popup'ın çalışmadığı yerler
        return;
      }
      throw e;
    }
  } catch (e) {
    lsSet(FLAG, null);
    fail(e);
  }
}

export async function signOutCloud() {
  stopSync?.();
  stopSync = null;
  lsSet(FLAG, null);
  try {
    const { auth, authInst } = await sdk();
    await auth.signOut(authInst);
  } catch {
    /* yoksay */
  }
  set({ status: "idle", user: null, error: null });
}

function fail(e: unknown) {
  const code = (e as { code?: string }).code ?? "";
  const msg =
    code === "permission-denied"
      ? "Bulutta okuma/yazma izni yok. Firestore kurallarını kontrol et."
      : code === "auth/unauthorized-domain"
        ? "Bu alan adı Firebase'de yetkili değil. Authentication → Settings → Authorized domains'e ekle."
        : code === "auth/operation-not-allowed"
          ? "Firebase'de Google girişi açık değil."
          : code === "unavailable" || code === "auth/network-request-failed"
            ? "Bağlantı yok. İnternet gelince otomatik eşitlenecek."
            : "Eşitleme hatası" + (code ? ` (${code})` : "");
  set({ status: "error", error: msg });
}

// ---- eşitleme ----
const sigOf = (v: unknown) => JSON.stringify(v);

async function startSync(user: CloudUser) {
  const { fs, db } = await sdk();
  const me = deviceId();
  const monthsCol = fs.collection(db, "users", user.uid, "months");
  const metaRef = fs.doc(db, "users", user.uid, "meta", "main");
  const pushed = new Map<string, string>();
  let applying = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;
  const unsubs: (() => void)[] = [];

  const stop = () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    unsubs.forEach((u) => u());
    window.removeEventListener("online", schedule);
  };
  stopSync?.();
  stopSync = stop;

  const applyToStore = (fn: (cur: AppData) => AppData) => {
    applying = true;
    try {
      useStore.getState().replaceData(fn(snapshot()));
    } finally {
      applying = false;
    }
  };

  const parseMonth = (raw: unknown): Record<string, DayEntry> => {
    try {
      return normalizeData({ entries: JSON.parse(String(raw)) })?.data.entries ?? {};
    } catch {
      return {};
    }
  };
  const parseMeta = (raw: unknown): MetaDoc | null => {
    try {
      const m = JSON.parse(String(raw));
      const n = normalizeData({ profile: { name: m.name, onboarded: m.onboarded }, goals: m.goals, entries: {}, courses: m.courses, exams: m.exams, plans: m.plans, customRoutines: m.customRoutines, hidden: m.hidden, legacy: m.legacy });
      return n ? { ...toMeta(n.data) } : null;
    } catch {
      return null;
    }
  };

  async function push() {
    if (stopped) return;
    const d = snapshot();
    const months = splitMonths(d.entries);
    const writes: { ref: ReturnType<typeof fs.doc>; data: Record<string, unknown>; key: string; sig: string }[] = [];
    for (const m of new Set([...Object.keys(months), ...[...pushed.keys()].filter((k) => k !== "meta")])) {
      const sig = sigOf(months[m] ?? {});
      if (pushed.get(m) !== sig) writes.push({ ref: fs.doc(db, "users", user.uid, "months", m), data: { entries: sig, updatedAt: Date.now(), device: me }, key: m, sig });
    }
    const metaSig = sigOf(toMeta(d));
    if (pushed.get("meta") !== metaSig) writes.push({ ref: metaRef, data: { data: metaSig, updatedAt: Date.now(), device: me }, key: "meta", sig: metaSig });
    if (!writes.length) {
      set({ status: "synced" });
      return;
    }
    set({ status: "syncing" });
    try {
      for (let i = 0; i < writes.length; i += 400) {
        const batch = fs.writeBatch(db);
        for (const w of writes.slice(i, i + 400)) batch.set(w.ref, w.data);
        await batch.commit();
      }
      for (const w of writes) pushed.set(w.key, w.sig);
      set({ status: "synced", lastSync: Date.now(), error: null });
    } catch (e) {
      fail(e);
    }
  }

  function schedule() {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => void push(), 1200);
  }

  try {
    // 1) Buluttaki veriyi oku ve bu cihazdakiyle birleştir. Okuma başarısızsa hiçbir şey yazılmaz.
    set({ status: "syncing" });
    const [metaSnap, monthsSnap] = await Promise.all([fs.getDoc(metaRef), fs.getDocs(monthsCol)]);
    if (stopped) return;
    const cloud: AppData = emptyData();
    let hasCloud = false;
    if (metaSnap.exists()) {
      const m = parseMeta(metaSnap.data().data);
      if (m) {
        hasCloud = true;
        cloud.profile = { ...cloud.profile, name: m.name, onboarded: m.onboarded };
        Object.assign(cloud, { goals: m.goals, courses: m.courses, exams: m.exams, plans: m.plans, customRoutines: m.customRoutines, hidden: m.hidden, legacy: m.legacy });
      }
    }
    monthsSnap.forEach((doc) => {
      hasCloud = true;
      Object.assign(cloud.entries, parseMonth(doc.data().entries));
    });
    if (hasCloud) applyToStore((local) => mergeData(cloud, local));
    // Yerel değişiklikleri hemen izlemeye başla; ilk yazma sürerken yapılanlar da kaçmasın.
    unsubs.push(
      useStore.subscribe(() => {
        if (!applying) schedule();
      }),
    );
    await push(); // birleşmiş durumu buluta yaz (ve bu cihazın parmak izini oluştur)

    // 2) Diğer cihazlardan gelen değişiklikleri canlı uygula.
    unsubs.push(
      fs.onSnapshot(monthsCol, (snap) => {
        for (const ch of snap.docChanges()) {
          const data = ch.doc.data();
          if (ch.type === "removed" || data.device === me) continue;
          const month = ch.doc.id;
          const incoming = parseMonth(data.entries);
          applyToStore((cur) => {
            const kept = Object.fromEntries(Object.entries(cur.entries).filter(([d]) => monthOfDate(d) !== month));
            return { ...cur, entries: { ...kept, ...incoming } };
          });
          pushed.set(month, sigOf(splitMonths(snapshot().entries)[month] ?? {}));
          set({ lastSync: Date.now() });
        }
      }, (err) => !stopped && fail(err)),
      fs.onSnapshot(metaRef, (snap) => {
        const data = snap.data();
        if (!snap.exists() || !data || data.device === me) return;
        const m = parseMeta(data.data);
        if (!m) return;
        applyToStore((cur) => ({ ...cur, profile: { ...cur.profile, name: m.name, onboarded: cur.profile.onboarded || m.onboarded }, goals: m.goals, courses: m.courses, exams: m.exams, plans: m.plans, customRoutines: m.customRoutines, hidden: m.hidden, ...(m.legacy !== undefined ? { legacy: m.legacy } : {}) }));
        pushed.set("meta", sigOf(toMeta(snapshot())));
        set({ lastSync: Date.now() });
      }, (err) => !stopped && fail(err)),
    );
    window.addEventListener("online", schedule);
    schedule(); // ilk yazma sürerken yapılmış değişiklikler kaçmasın
  } catch (e) {
    fail(e);
  }
}

/** Ayarlar'daki "Şimdi eşitle" düğmesi: yeniden bağlanıp birleştirir. */
export async function syncNow() {
  const u = useCloud.getState().user;
  if (u) await startSync(u);
}

/** Yalnızca emülatör modunda (test): sahte Google kimliğiyle açılır; gerçek Google penceresi gerektirmez. */
if (env.emulator && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__alpbookEmuSignIn = async (email: string) => {
    const { auth, authInst } = await sdk();
    lsSet(FLAG, "1");
    await attach();
    const idToken = JSON.stringify({ sub: email, email, email_verified: true, display_name: email.split("@")[0] });
    await auth.signInWithCredential(authInst, auth.GoogleAuthProvider.credential(idToken));
  };
}
