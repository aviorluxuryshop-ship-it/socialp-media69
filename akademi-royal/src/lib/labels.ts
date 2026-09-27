import type {
  CalendarEventType,
  CourseGroupStatus,
  EnrollmentStatus,
  ExpenseStatus,
  FinancialAccountType,
  PaymentMethod,
  StudentStatus,
  TaskPriority,
  TaskStatus,
  TrainerPayType,
} from '@prisma/client';

export const PAY_TYPE_LABELS: Record<TrainerPayType, string> = {
  HOURLY: 'Saatlik',
  MONTHLY: 'Aylık',
  PER_SESSION: 'Ders Başı',
  FIXED: 'Sabit',
};

export const COURSE_GROUP_STATUS_LABELS: Record<CourseGroupStatus, string> = {
  PLANNED: 'Planlandı',
  ACTIVE: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const DAY_LABELS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
  LEAD: 'Aday',
  ACTIVE: 'Aktif',
  COMPLETED: 'Mezun',
  FROZEN: 'Dondu',
  WITHDRAWN: 'Ayrıldı',
};

export const STUDENT_STATUS_TONES: Record<StudentStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  LEAD: 'info',
  ACTIVE: 'success',
  COMPLETED: 'default',
  FROZEN: 'warning',
  WITHDRAWN: 'danger',
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: 'Bekliyor',
  ACTIVE: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const FINANCIAL_ACCOUNT_TYPE_LABELS: Record<FinancialAccountType, string> = {
  CASH: 'Nakit',
  BANK: 'Banka',
  POS: 'POS',
  CREDIT_CARD: 'Kredi Kartı',
  OTHER: 'Diğer',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Nakit',
  CREDIT_CARD: 'Kredi Kartı',
  BANK_TRANSFER: 'Havale/EFT',
  CHECK: 'Çek',
  OTHER: 'Diğer',
};

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  CLASS: 'Ders',
  EXAM: 'MEB Sınavı',
  MEETING: 'Toplantı',
  TASK_DUE: 'Görev Son Tarihi',
  STAFF_LEAVE: 'Personel İzni',
  HOLIDAY: 'Tatil',
  OTHER: 'Diğer',
};

// Manuel etkinlik oluşturma formunda gösterilecek tipler — CLASS (ders programından
// otomatik türetilir) ve TASK_DUE (Görevler modülünden otomatik yansır) hariç.
export const MANUAL_CALENDAR_EVENT_TYPES: CalendarEventType[] = ['EXAM', 'MEETING', 'STAFF_LEAVE', 'HOLIDAY', 'OTHER'];

// Takvimde otomatik türetilen, CalendarEventType enum'ında olmayan ek öğe tipleri
// (CLASS ve TASK_DUE zaten CALENDAR_EVENT_TYPE_LABELS içinde tanımlı).
export const EXTRA_CALENDAR_ITEM_LABELS: Record<string, string> = {
  COLLECTION: 'Tahsilat Günü',
  EXPENSE_DUE: 'Ödeme Günü',
};

export const CALENDAR_FILTERS = [
  { key: 'all', label: 'Tümü' },
  { key: 'courses', label: 'Eğitimler' },
  { key: 'tasks', label: 'Görevler' },
  { key: 'collections', label: 'Tahsilat Günleri' },
  { key: 'payments', label: 'Ödeme Günleri' },
] as const;

export type CalendarFilterKey = (typeof CALENDAR_FILTERS)[number]['key'];

export const CALENDAR_FILTER_TYPES: Record<CalendarFilterKey, string[] | null> = {
  all: null,
  courses: ['CLASS'],
  tasks: ['TASK_DUE'],
  collections: ['COLLECTION'],
  payments: ['EXPENSE_DUE'],
};

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  PENDING: 'Bekliyor',
  APPROVED: 'Onaylandı',
  REJECTED: 'Reddedildi',
  PAID: 'Ödendi',
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam Ediyor',
  DONE: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Düşük',
  MEDIUM: 'Orta',
  HIGH: 'Yüksek',
  URGENT: 'Acil',
};
