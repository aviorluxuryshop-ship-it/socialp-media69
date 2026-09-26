import type { CourseGroupStatus, EnrollmentStatus, StudentStatus, TrainerPayType } from '@prisma/client';

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

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING: 'Bekliyor',
  ACTIVE: 'Devam Ediyor',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal Edildi',
};
