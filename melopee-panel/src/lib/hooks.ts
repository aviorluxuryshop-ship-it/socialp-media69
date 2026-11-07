"use client";

import { useEffect, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { todayKey } from "./dates";
import { exportData, useStore } from "./store";
import type { AppData, Branch, Customer, Service, Staff } from "./types";

/** Bugünün anahtarı ve günün dakikası; her dakika yenilenir (gece yarısı geçişini de yakalar). */
export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return { today: todayKey(), minutes: now.getHours() * 60 + now.getMinutes() };
}

/** Tüm iş verisi (sığ karşılaştırmalı). */
export function useData(): AppData {
  return useStore(useShallow((s) => exportData(s)));
}

export interface Lookup {
  staff: Map<string, Staff>;
  customers: Map<string, Customer>;
  services: Map<string, Service>;
  branches: Map<string, Branch>;
}

export function useLookup(): Lookup {
  const { staff, customers, services, branches } = useStore(
    useShallow((s) => ({ staff: s.staff, customers: s.customers, services: s.services, branches: s.branches })),
  );
  return useMemo(
    () => ({
      staff: new Map(staff.map((x) => [x.id, x])),
      customers: new Map(customers.map((x) => [x.id, x])),
      services: new Map(services.map((x) => [x.id, x])),
      branches: new Map(branches.map((x) => [x.id, x])),
    }),
    [staff, customers, services, branches],
  );
}
