// Melopée Panel veri modeli. Tarihler yerel "YYYY-AA-GG", saatler "SS:DD" metni olarak tutulur.

export type BranchId = string;

export interface Branch {
  id: BranchId;
  name: string;
  address: string;
  phone: string;
  /** Takvimde ve grafiklerde şubeyi temsil eden renk. */
  color: string;
  /** Açılış/kapanış saati (tam saat). */
  openHour: number;
  closeHour: number;
}

export type StaffRole = "Kıdemli Nail Artist" | "Nail Artist" | "Manikür & Pedikür Uzmanı" | "Stajyer";

export interface Staff {
  id: string;
  name: string;
  branchId: BranchId;
  role: StaffRole;
  phone: string;
  color: string;
  /** Hizmet cirosundan alınan prim yüzdesi (0–100). */
  commissionRate: number;
  /** Aylık sabit maaş (₺). */
  salary: number;
  /** Çalıştığı günler: 0 = Pazar … 6 = Cumartesi. */
  workDays: number[];
  /** Personel paneli girişi için 4 haneli PIN. */
  pin: string;
  active: boolean;
  startDate: string;
}

export type ServiceCategory = "Manikür" | "Pedikür" | "Kalıcı Oje" | "Protez Tırnak" | "Nail Art" | "Bakım";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMin: number;
  price: number;
  active: boolean;
}

export type CustomerSource = "Instagram" | "Tavsiye" | "Google" | "Yoldan" | "Diğer";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  /** "AA-GG" (yıl olmadan) ya da boş. */
  birthday: string;
  notes: string;
  allergies: string;
  vip: boolean;
  source: CustomerSource;
  preferredStaffId: string | null;
  createdAt: string;
}

export type AppointmentStatus = "planned" | "confirmed" | "completed" | "cancelled" | "noshow";
export type PaymentMethod = "nakit" | "kart" | "havale";

export interface Appointment {
  id: string;
  branchId: BranchId;
  staffId: string;
  customerId: string;
  serviceId: string;
  date: string;
  start: string;
  durationMin: number;
  /** Anlaşılan ücret (hizmet fiyatından farklı olabilir: indirim, ek nail art…). */
  price: number;
  status: AppointmentStatus;
  payment: PaymentMethod | null;
  note: string;
  createdAt: string;
}

export type TxType = "income" | "expense";

export const INCOME_CATEGORIES = ["Ürün Satışı", "Hediye Çeki", "Diğer Gelir"] as const;
export const EXPENSE_CATEGORIES = [
  "Kira",
  "Maaş & Prim",
  "Malzeme",
  "Fatura",
  "Pazarlama",
  "Vergi & Muhasebe",
  "Diğer Gider",
] as const;

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

/** Elle girilen gelir/gider kaydı. Randevu gelirleri randevulardan hesaplanır, burada tutulmaz. */
export interface Transaction {
  id: string;
  branchId: BranchId;
  type: TxType;
  category: IncomeCategory | ExpenseCategory;
  amount: number;
  date: string;
  note: string;
  payment: PaymentMethod | null;
}

export interface Settings {
  studioName: string;
  ownerName: string;
  ownerPin: string;
  /** Takvim adım aralığı (dakika). */
  slotMinutes: 15 | 30;
}

export interface AppData {
  branches: Branch[];
  staff: Staff[];
  services: Service[];
  customers: Customer[];
  appointments: Appointment[];
  transactions: Transaction[];
  settings: Settings;
}

export type Session = { role: "owner" } | { role: "staff"; staffId: string } | null;

/** "all" = tüm şubeler. */
export type BranchFilter = BranchId | "all";
