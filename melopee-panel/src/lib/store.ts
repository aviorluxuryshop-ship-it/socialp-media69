"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { toast } from "@/components/ui";
import { todayKey } from "./dates";
import { applyOp, type Op } from "./ops";
import { api, ApiError, REMOTE } from "./remote";
import { buildDemoData, emptyData } from "./seed";
import { uid } from "./uid";
import type {
  AppData,
  Appointment,
  AppointmentStatus,
  Branch,
  BranchFilter,
  Customer,
  PaymentMethod,
  Service,
  Session,
  Settings,
  Staff,
  Transaction,
} from "./types";
export { isAppData } from "./validate";

export const STORAGE_KEY = "melopee-panel:v1";

interface State extends AppData {
  session: Session;
  branchFilter: BranchFilter;
  /** Veri ilk kez yüklendi mi (tanıtım verisi yalnızca bir kez kurulur). */
  initialized: boolean;
  demo: boolean;
  hydrated: boolean;
  /** Sunucu modunda verinin sürümü ve dönemi (diğer cihazların değişikliklerini algılamak için). */
  version: number;
  epoch: string;
}

interface Actions {
  /** Yerel modda doğrudan oturum açar; sunucu modunda bkz. remoteLogin. */
  login: (s: Session) => void;
  logout: () => void;
  setBranchFilter: (f: BranchFilter) => void;

  saveAppointment: (a: Omit<Appointment, "id" | "createdAt"> & { id?: string }) => string;
  setAppointmentStatus: (id: string, status: AppointmentStatus, payment?: PaymentMethod | null) => void;
  deleteAppointment: (id: string) => void;

  saveCustomer: (c: Omit<Customer, "id" | "createdAt"> & { id?: string }) => string;
  deleteCustomer: (id: string) => void;

  saveStaff: (s: Omit<Staff, "id"> & { id?: string }) => string;
  saveService: (s: Omit<Service, "id"> & { id?: string }) => string;
  saveBranch: (b: Branch) => void;
  saveTransaction: (t: Omit<Transaction, "id"> & { id?: string }) => string;
  deleteTransaction: (id: string) => void;
  saveSettings: (s: Partial<Settings>) => void;

  loadDemo: () => Promise<void>;
  startEmpty: () => Promise<void>;
  importData: (d: AppData) => Promise<void>;
}

export type Store = State & Actions;

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Dışa aktarma için yalnızca iş verisi. */
export function exportData(s: Pick<Store, keyof AppData>): AppData {
  const { branches, staff, services, customers, appointments, transactions, settings } = s;
  return { branches, staff, services, customers, appointments, transactions, settings };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => {
      /** Değişikliği hemen ekrana uygular; sunucu modunda sıraya alıp sunucuya da gönderir. */
      const dispatch = (op: Op) => {
        set(applyOp(exportData(get()), op));
        if (REMOTE) pushOp(op);
      };

      return {
        ...emptyData(),
        session: null,
        branchFilter: "all",
        initialized: false,
        demo: false,
        hydrated: false,
        version: 0,
        epoch: "",

        login: (session) => set({ session }),
        logout: () => {
          if (REMOTE) {
            stopSync();
            void api("auth/logout", {}).catch(() => {});
            set({ ...emptyData(), session: null, version: 0, epoch: "", demo: false });
          } else set({ session: null });
        },
        setBranchFilter: (branchFilter) => set({ branchFilter }),

        saveAppointment: (a) => {
          const id = a.id ?? uid("a");
          const prev = get().appointments.find((x) => x.id === id);
          dispatch({ t: "appt.save", a: { ...a, id, createdAt: prev?.createdAt ?? todayKey() } });
          return id;
        },
        setAppointmentStatus: (id, status, payment) => dispatch({ t: "appt.status", id, status, payment: payment ?? null }),
        deleteAppointment: (id) => dispatch({ t: "appt.delete", id }),

        saveCustomer: (c) => {
          const id = c.id ?? uid("c");
          const prev = get().customers.find((x) => x.id === id);
          dispatch({ t: "customer.save", c: { ...c, id, createdAt: prev?.createdAt ?? todayKey() } });
          return id;
        },
        deleteCustomer: (id) => dispatch({ t: "customer.delete", id }),

        saveStaff: (st) => {
          const id = st.id ?? uid("p");
          dispatch({ t: "staff.save", s: { ...st, id } });
          return id;
        },
        saveService: (sv) => {
          const id = sv.id ?? uid("s");
          dispatch({ t: "service.save", s: { ...sv, id } });
          return id;
        },
        saveBranch: (b) => dispatch({ t: "branch.save", b }),
        saveTransaction: (t) => {
          const id = t.id ?? uid("t");
          dispatch({ t: "tx.save", tx: { ...t, id } });
          return id;
        },
        deleteTransaction: (id) => dispatch({ t: "tx.delete", id }),
        saveSettings: (p) => {
          const { ownerPin, ...rest } = p;
          if (Object.keys(rest).length) dispatch({ t: "settings.save", p: rest });
          // Yerel modda yönetici PIN'i cihazda tutulur; sunucu modunda şifre ayrı uçtan değişir.
          if (!REMOTE && ownerPin !== undefined) set((s) => ({ settings: { ...s.settings, ownerPin } }));
        },

        loadDemo: async () => {
          if (REMOTE) {
            await api("admin/reset", { mode: "demo" });
            await reloadAll();
          } else set({ ...buildDemoData(todayKey(), nowMinutes()), initialized: true, demo: true, branchFilter: "all" });
        },
        startEmpty: async () => {
          if (REMOTE) {
            await api("admin/reset", { mode: "empty" });
            await reloadAll();
            set({ branchFilter: "all" });
          } else set({ ...emptyData(), initialized: true, demo: false, branchFilter: "all", session: { role: "owner" } });
        },
        importData: async (d) => {
          if (REMOTE) {
            await api("admin/import", { data: d });
            await reloadAll();
          } else set({ ...d, initialized: true, demo: false, branchFilter: "all" });
        },
      };
    },
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Sunucu modunda müşteri verisi cihazda saklanmaz; yalnızca şube tercihi hatırlanır.
      partialize: (s) =>
        (REMOTE
          ? { branchFilter: s.branchFilter }
          : Object.fromEntries(Object.entries(s).filter(([k, v]) => typeof v !== "function" && k !== "hydrated" && k !== "version" && k !== "epoch"))) as Partial<Store>,
      // Sunucu çıktısıyla uyuşmazlık olmasın diye yükleme, istemcide bağlandıktan sonra (Boot) yapılır.
      skipHydration: true,
    },
  ),
);

/* ───────── Sunucu eşitlemesi ───────── */

interface ServerPayload {
  data: AppData;
  meta: { demo: boolean; epoch: string };
  version: number;
}
type ChangeRow = { kind: string; id: string; data: unknown; deleted?: boolean };

const KIND_TO_KEY: Record<string, keyof AppData> = {
  branch: "branches",
  staff: "staff",
  service: "services",
  customer: "customers",
  appt: "appointments",
  tx: "transactions",
};

const queue: Op[] = [];
let flushing = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let polling = false;

function handleAuthLoss() {
  stopSync();
  useStore.setState({ ...emptyData(), session: null, version: 0, epoch: "" });
  toast("Oturum süresi doldu, tekrar giriş yapın");
}

/** Sıradaki işlemleri sırayla sunucuya yazar; hata olursa sunucudaki doğru hali yeniden yükler. */
function pushOp(op: Op) {
  queue.push(op);
  if (!flushing) void flush();
}

async function flush() {
  flushing = true;
  while (queue.length) {
    const op = queue[0]!;
    try {
      await api("ops", { op });
      queue.shift();
    } catch (e) {
      queue.length = 0;
      if (e instanceof ApiError && e.status === 401) {
        handleAuthLoss();
        break;
      }
      toast(e instanceof ApiError ? e.message : "Değişiklik kaydedilemedi");
      await reloadAll().catch(() => {});
      break;
    }
  }
  flushing = false;
}

/** Sunucudan tüm veriyi (yönetici) ya da yalnızca kendi programını (personel) yükler. */
export async function reloadAll() {
  const p = await api<ServerPayload>("data");
  useStore.setState({ ...p.data, demo: p.meta.demo, epoch: p.meta.epoch, version: p.version, initialized: true });
}

function applyChanges(rows: ChangeRow[]) {
  const s = useStore.getState();
  const next: Partial<AppData> & { demo?: boolean } = {};
  for (const r of rows) {
    if (r.kind === "settings") {
      next.settings = { ...(next.settings ?? s.settings), ...(r.data as Partial<Settings>), ownerPin: "" };
      continue;
    }
    if (r.kind === "meta") {
      next.demo = (r.data as { demo: boolean }).demo;
      continue;
    }
    const key = KIND_TO_KEY[r.kind];
    if (!key || key === "settings") continue;
    const list = ((next[key] as { id: string }[] | undefined) ?? (s[key] as { id: string }[])).filter((x) => x.id !== r.id);
    if (!r.deleted) list.push(r.data as { id: string });
    (next as Record<string, unknown>)[key] = list;
  }
  if (next.appointments) next.appointments.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  useStore.setState(next);
}

/** Diğer cihazlarda yapılan değişiklikleri çeker. Kendi kayıtları bekliyorsa atlar. */
export async function pollOnce() {
  const s = useStore.getState();
  if (!s.session || polling || flushing || queue.length) return;
  polling = true;
  try {
    const v = await api<{ version: number; epoch: string }>("version");
    if (v.epoch !== s.epoch || s.session.role === "staff") {
      if (v.epoch !== s.epoch || v.version !== s.version) await reloadAll();
    } else if (v.version > s.version) {
      const c = await api<{ version: number; epoch: string; rows: ChangeRow[] }>(`changes?since=${s.version}`);
      if (c.epoch !== useStore.getState().epoch) await reloadAll();
      else {
        applyChanges(c.rows);
        useStore.setState({ version: c.version });
      }
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) handleAuthLoss();
  } finally {
    polling = false;
  }
}

const onVisible = () => {
  if (document.visibilityState === "visible") void pollOnce();
};

export function startSync() {
  if (pollTimer) return;
  // Sekme açıkken 30 sn'de bir; arka plandayken veritabanını uyandırmamak için yoklama yapılmaz.
  pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") void pollOnce();
  }, 30_000);
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onVisible);
}

export function stopSync() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  document.removeEventListener("visibilitychange", onVisible);
  window.removeEventListener("focus", onVisible);
}

/** Sunucu modunda giriş: başarılı olursa oturumu açar ve veriyi yükler. */
export async function remoteLogin(body: { role: "owner" } | { role: "staff"; staffId: string }, secret: string) {
  await api("auth/login", { ...body, secret });
  await reloadAll();
  useStore.setState({ session: body.role === "owner" ? { role: "owner" } : { role: "staff", staffId: body.staffId } });
  startSync();
}

/** Yerel depodan yükler; ilk açılışta tanıtım verisini kurar. Sunucu modunda oturumu ve veriyi sunucudan alır. */
export async function hydrateStore() {
  if (useStore.getState().hydrated) return;
  try {
    // Tarayıcı depolaması kapalıysa (gizli pencere vb.) persist API'si olmayabilir; veri bu oturumda bellekte kalır.
    await useStore.persist?.rehydrate();
  } catch {
    /* depolama okunamadı */
  }
  if (REMOTE) {
    try {
      const { session } = await api<{ session: Session }>("auth/session");
      if (session) {
        await reloadAll();
        useStore.setState({ session });
        startSync();
      } else useStore.setState({ session: null });
    } catch {
      useStore.setState({ session: null });
    }
  } else if (!useStore.getState().initialized) useStore.getState().loadDemo();
  useStore.setState({ hydrated: true });
}
