"use client";

import { create } from "zustand";
import type { Appointment } from "./types";

export type AppointmentDraft = Partial<Omit<Appointment, "createdAt">>;

/** Kalıcı olmayan arayüz durumu: hangi pencere açık, hangi kayıt seçili. */
interface UiState {
  apptForm: AppointmentDraft | null;
  apptDetail: string | null;
  customerDetail: string | null;
  navOpen: boolean;
  /** Takvimde görüntülenen gün; üst çubuktaki "Yeni randevu" bu günü önerir. */
  focusDate: string | null;
  setFocusDate: (d: string | null) => void;
  openApptForm: (d?: AppointmentDraft) => void;
  closeApptForm: () => void;
  openAppt: (id: string | null) => void;
  openCustomer: (id: string | null) => void;
  setNav: (v: boolean) => void;
}

export const useUi = create<UiState>((set) => ({
  apptForm: null,
  apptDetail: null,
  customerDetail: null,
  navOpen: false,
  focusDate: null,
  setFocusDate: (focusDate) => set({ focusDate }),
  openApptForm: (d = {}) => set({ apptForm: d, apptDetail: null }),
  closeApptForm: () => set({ apptForm: null }),
  openAppt: (id) => set({ apptDetail: id }),
  openCustomer: (id) => set({ customerDetail: id }),
  setNav: (navOpen) => set({ navOpen }),
}));
