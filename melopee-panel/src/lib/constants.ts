import type { AppointmentStatus, PaymentMethod, ServiceCategory, StaffRole, CustomerSource } from "./types";

/**
 * Kategorik renk sırası (grafik serileri, personel ve şube kimliği). Sıra renk körlüğü
 * ayrımı için doğrulandı; döngüyle tekrar edilmez, sırayla atanır.
 */
export const SERIES = ["#A3486A", "#3C6FB4", "#B97F2E", "#00968A", "#7A5BC4", "#D9705A"] as const;

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  planned: "Planlandı",
  confirmed: "Onaylandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
  noshow: "Gelmedi",
};

export const STATUS_ORDER: AppointmentStatus[] = ["planned", "confirmed", "completed", "cancelled", "noshow"];

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  nakit: "Nakit",
  kart: "Kredi kartı",
  havale: "Havale / EFT",
};

export const SERVICE_CATEGORIES: ServiceCategory[] = ["Manikür", "Pedikür", "Kalıcı Oje", "Protez Tırnak", "Nail Art", "Bakım"];

export const STAFF_ROLES: StaffRole[] = ["Kıdemli Nail Artist", "Nail Artist", "Manikür & Pedikür Uzmanı", "Stajyer"];

export const CUSTOMER_SOURCES: CustomerSource[] = ["Instagram", "Tavsiye", "Google", "Yoldan", "Diğer"];

/** Bu kadar gündür gelmeyen müşteri "geri kazanım" listesine düşer. */
export const LAPSED_DAYS = 45;

/** Gelire sayılan durumlar. */
export const REVENUE_STATUSES: AppointmentStatus[] = ["completed"];
/** Takvimi meşgul eden durumlar. */
export const BUSY_STATUSES: AppointmentStatus[] = ["planned", "confirmed", "completed"];
