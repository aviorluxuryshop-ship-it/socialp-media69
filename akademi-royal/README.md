# Akademi Royal — Yönetim Paneli

Akademi Royal (Academy of Beauty, Bakırköy) için kurum içi eğitim akademisi yönetim
sistemi. Öğrenciler, eğitimler/gruplar, personel/eğitmenler, ödeme & cari hesap,
kasa/banka/POS hesapları, masraflar, görevler, takvim ve raporlamayı tek panelden
yönetmeyi amaçlar.

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM
- Auth ve RBAC (Faz 0 kapsamında eklenecek)

## Kurulum

```bash
npm install
cp .env.example .env   # DATABASE_URL'i kendi PostgreSQL bağlantınıza göre düzenleyin
npm run prisma:migrate
npm run dev
```

## Veri Modeli

Tüm tablolar ve ilişkiler `prisma/schema.prisma` içinde tanımlı. Ana modül grupları:

- **Kimlik & Yetki**: `User`, `Role`, `Permission`, `RolePermission`, `AuditLog`
- **Personeller**: `Staff`, `Trainer`, `StaffDocument`
- **Öğrenciler**: `Student`, `StudentNote`, `StudentDocument`
- **Eğitimler**: `Course`, `CourseGroup`, `CourseGroupScheduleSlot`, `CourseSession`, `GroupEnrollment`, `Attendance`, `Certificate`
- **Sözleşmeler**: `ContractTemplate` (otomatik sözleşme/belge üretimi)
- **Hesaplarım**: `FinancialAccount` (Kasa/Banka/POS), `FinancialAccountEntry`, `EnrollmentPricing`, `Installment`, `Payment`, `AccountTransaction` (öğrenci cari hesabı)
- **Masraflar**: `ExpenseCategory`, `Expense`
- **Görevler**: `Task` (havuz desteği: `assignedToUserId` null = görev havuzunda), `TaskComment`
- **Takvim**: `CalendarEvent`
- **Ayarlar**: `SystemSetting`

## Roller (başlangıç seti)

Süper Yönetici, Yönetici/Müdür, Eğitim Danışmanı, Eğitmen, Muhasebe/Finans,
Operasyon/Sekreterya. Roller ve izinler `Role`/`Permission`/`RolePermission`
tabloları üzerinden yönetilir; yeni rol eklemek şema değişikliği gerektirmez.

## Geliştirme Fazları

| Faz | Modül | Durum |
|---|---|---|
| 0 | Altyapı: Auth, Roller/Yetkiler, temel layout, Ayarlar | Devam ediyor (proje iskeleti + veri modeli hazır; Auth/RBAC bekliyor) |
| 1 | Personeller | Bekliyor |
| 2 | Eğitimler (Kurslar + Gruplar + Ders Programı) | Bekliyor |
| 3 | Öğrenciler | Bekliyor |
| 4 | Hesaplarım (Ödeme / Cari Hesap / Kasa-Banka-POS) | Bekliyor |
| 5 | Takvim & Planlama | Bekliyor |
| 6 | Masraflar | Bekliyor |
| 7 | Görevler | Bekliyor |
| 8 | Raporlar | Bekliyor |
| 9 | Dashboard (nihai hali) | Bekliyor |

Her faz, bir önceki fazın verisine bağımlı olacak şekilde sıralandı (örn. bir
öğrenci bir eğitim grubuna kaydolabilmesi için Eğitimler modülü önce hazır olmalı).
