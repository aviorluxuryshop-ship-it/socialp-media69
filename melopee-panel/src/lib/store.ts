"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { todayKey } from "./dates";
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

export const STORAGE_KEY = "melopee-panel:v1";

interface State extends AppData {
  session: Session;
  branchFilter: BranchFilter;
  /** Veri ilk kez yüklendi mi (tanıtım verisi yalnızca bir kez kurulur). */
  initialized: boolean;
  demo: boolean;
  hydrated: boolean;
}

interface Actions {
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

  loadDemo: () => void;
  startEmpty: () => void;
  importData: (d: AppData) => void;
}

export type Store = State & Actions;

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...emptyData(),
      session: null,
      branchFilter: "all",
      initialized: false,
      demo: false,
      hydrated: false,

      login: (session) => set({ session }),
      logout: () => set({ session: null }),
      setBranchFilter: (branchFilter) => set({ branchFilter }),

      saveAppointment: (a) => {
        const id = a.id ?? uid("a");
        const prev = get().appointments.find((x) => x.id === id);
        const item: Appointment = { ...a, id, createdAt: prev?.createdAt ?? todayKey() };
        set((s) => ({ appointments: upsert(s.appointments, item) }));
        return id;
      },
      setAppointmentStatus: (id, status, payment) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id
              ? { ...a, status, payment: status === "completed" ? (payment ?? a.payment ?? "kart") : null }
              : a,
          ),
        })),
      deleteAppointment: (id) => set((s) => ({ appointments: s.appointments.filter((a) => a.id !== id) })),

      saveCustomer: (c) => {
        const id = c.id ?? uid("c");
        const prev = get().customers.find((x) => x.id === id);
        set((s) => ({ customers: upsert(s.customers, { ...c, id, createdAt: prev?.createdAt ?? todayKey() }) }));
        return id;
      },
      deleteCustomer: (id) =>
        set((s) => ({
          customers: s.customers.filter((c) => c.id !== id),
          appointments: s.appointments.filter((a) => a.customerId !== id),
        })),

      saveStaff: (st) => {
        const id = st.id ?? uid("p");
        set((s) => ({ staff: upsert(s.staff, { ...st, id }) }));
        return id;
      },
      saveService: (sv) => {
        const id = sv.id ?? uid("s");
        set((s) => ({ services: upsert(s.services, { ...sv, id }) }));
        return id;
      },
      saveBranch: (b) => set((s) => ({ branches: upsert(s.branches, b) })),
      saveTransaction: (t) => {
        const id = t.id ?? uid("t");
        set((s) => ({ transactions: upsert(s.transactions, { ...t, id }) }));
        return id;
      },
      deleteTransaction: (id) => set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),
      saveSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),

      loadDemo: () => set({ ...buildDemoData(todayKey(), nowMinutes()), initialized: true, demo: true, branchFilter: "all" }),
      startEmpty: () => set({ ...emptyData(), initialized: true, demo: false, branchFilter: "all", session: { role: "owner" } }),
      importData: (d) => set({ ...d, initialized: true, demo: false, branchFilter: "all" }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ hydrated: _h, ...rest }) =>
        Object.fromEntries(Object.entries(rest).filter(([, v]) => typeof v !== "function")) as Partial<Store>,
      // Sunucu çıktısıyla uyuşmazlık olmasın diye yükleme, istemcide bağlandıktan sonra (Boot) yapılır.
      skipHydration: true,
    },
  ),
);

/** Yerel depodan yükler; ilk açılışta tanıtım verisini kurar. Boot bileşeni bir kez çağırır. */
export async function hydrateStore() {
  if (useStore.getState().hydrated) return;
  try {
    // Tarayıcı depolaması kapalıysa (gizli pencere vb.) persist API'si olmayabilir; veri bu oturumda bellekte kalır.
    await useStore.persist?.rehydrate();
  } catch {
    /* depolama okunamadı: tanıtım verisiyle devam */
  }
  if (!useStore.getState().initialized) useStore.getState().loadDemo();
  useStore.setState({ hydrated: true });
}

/** Dışa aktarma için yalnızca iş verisi. */
export function exportData(s: Store): AppData {
  const { branches, staff, services, customers, appointments, transactions, settings } = s;
  return { branches, staff, services, customers, appointments, transactions, settings };
}

export function isAppData(x: unknown): x is AppData {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return ["branches", "staff", "services", "customers", "appointments", "transactions"].every((k) => Array.isArray(d[k])) && typeof d.settings === "object";
}
