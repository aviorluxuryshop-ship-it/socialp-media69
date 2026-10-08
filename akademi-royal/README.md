# Akademi Royal — Yönetim Paneli

Akademi Royal (Academy of Beauty, Bakırköy) için kurum içi eğitim akademisi yönetim
sistemi. Öğrenciler, eğitimler/gruplar, personel/eğitmenler, ödeme & cari hesap,
kasa/banka/POS hesapları, masraflar, görevler, takvim ve raporlamayı tek panelden
yönetmeyi amaçlar.

## Teknoloji

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma ORM
- Credentials tabanlı Auth (bcrypt + jose imzalı httpOnly cookie) + rol/izin tabanlı RBAC

## Kurulum

```bash
npm install
cp .env.example .env   # DATABASE_URL ve SESSION_SECRET'i düzenleyin
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### İlk giriş

Seed script aşağıdaki yönetici hesabını oluşturur:

- **E-posta:** `admin@akademiroyal.com`
- **Şifre:** `AkademiRoyal2026!`

Üretim ortamına geçmeden önce bu şifreyi değiştirin.

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
| 0 | Altyapı: Auth, Roller/Yetkiler, temel layout, Ayarlar | ✅ Tamamlandı |
| 1 | Personeller | ✅ Tamamlandı |
| 2 | Eğitimler (Kurslar + Gruplar + Ders Programı) | ✅ Tamamlandı |
| 3 | Öğrenciler | ✅ Tamamlandı |
| 4 | Hesaplarım (Ödeme / Cari Hesap / Kasa-Banka-POS) | ✅ Tamamlandı |
| 5 | Takvim & Planlama | ✅ Tamamlandı |
| 6 | Masraflar | ✅ Tamamlandı |
| 7 | Görevler | ✅ Tamamlandı |
| 8 | Raporlar | ✅ Tamamlandı |
| 9 | Dashboard (nihai hali) | ✅ Tamamlandı |

Her faz, bir önceki fazın verisine bağımlı olacak şekilde sıralandı (örn. bir
öğrenci bir eğitim grubuna kaydolabilmesi için Eğitimler modülü önce hazır olmalı).
10 fazın tamamı tamamlandı ve her biri Playwright ile uçtan uca (gerçek tarayıcıda,
gerçek PostgreSQL üzerinde) doğrulandı.

## İlk Kullanıcı Geri Bildirimleri Sonrası Eklenenler

10 fazın tamamlanmasının ardından gelen kullanım geri bildirimleriyle eklenen
geliştirmeler:

- Eğitim süresi artık **gün** cinsinden tutuluyor (önceden saat).
- Kenar menü **gizlenip açılabiliyor** (üstteki `⟨⟨` / `☰ Menü` düğmesi).
- **Koyu/Açık mod** düğmesi (üst bardaki 🌙/☀️), tercih tarayıcıda saklanıyor.
- Akademi Royal **logosu** kenar menüde ve giriş ekranında.
- Öğrenci durumları (Aday/Aktif/Mezun/Dondu/Ayrıldı) **renkli rozetlerle** gösteriliyor.
- Öğrenci ve eğitim grubu silme işlemleri artık kayıt/ödeme geçmişi olsa bile
  **kademeli (cascade) silme** ile çalışıyor; kullanıcı güçlü bir uyarıyla onaylıyor.
- Eğitim grubu detayından doğrudan **"+ Öğrenci Ekle"** ile kayıtlı bir öğrenci gruba dahil edilebiliyor.
- Her sayfada bir **"← Geri"** düğmesi var.
- Masraflar artık onaylandıktan/ödendikten sonra da **düzenlenebiliyor ve silinebiliyor**
  (ödenmiş bir masrafı silmek/düzenlemek ilgili kasa/banka hareketini de günceller).
- Hesaplarım: **Kredi Kartı** hesap tipi eklendi, hesaplar **pasife alınabiliyor veya
  (hareketi yoksa) silinebiliyor**, hesaplar arası **transfer** ekranı eklendi.
- Personel detayında **panel girişi** oluşturulabiliyor: e-posta/şifre/rol atanarak
  personel kendi bilgileriyle sisteme giriş yapabiliyor; rol, şifre ve aktif/pasif
  durumu daha sonra da yönetilebiliyor.
- Takvim & Planlama'ya **filtre** eklendi (Tümü / Eğitimler / Görevler / Tahsilat
  Günleri / Ödeme Günleri) ve bekleyen taksit/masraf günleri artık takvimde
  otomatik görünüyor; bir güne tıklamak o günün tüm planlarını listeliyor.
- Raporlar sayfasındaki eğitim raporu sütunu "Satış Adedi" olarak netleştirildi
  (kategoriye göre gider ve tarih aralığı filtreleri zaten mevcuttu).
- Görevler artık platform kullanıcılarına değil, doğrudan **personele** atanıyor;
  panel girişi olmayan personele de iş bölümü yapılabiliyor.
- Dashboard'daki üst KPI kutuları **tıklanabilir**: her biri altında ilgili
  kayıtların listesini açıp kapatıyor; aylık takvim panosunda bir güne tıklamak
  da ayrı bir sayfaya gitmeden altındaki panelde o günün planlarını gösteriyor.
- Öğrenciyi eğitime kaydederken artık **grup seçilmiyor** — doğrudan eğitim
  seçiliyor, sistem o eğitimin en uygun (devam eden, yoksa en güncel planlanan)
  grubunu otomatik buluyor; uygun grup yoksa açık bir hata gösteriyor.
- Masraf kaydı artık onay beklemeden **doğrudan ödenmiş olarak** kaydediliyor
  (kayıt sırasında hangi kasa/banka hesabından çıktığı seçiliyor).
- Raporlar sayfasında gösterilecek bölümler (**Gelir / Gider / Toplam Kayıt-
  Eğitim / Öğrenci Sayısı**) kendiniz seçip detaylandırabiliyorsunuz.
- Yeni **MEB** modülü: bir öğrencinin her eğitim kaydı için ayrı ayrı MEB
  (Milli Eğitim Bakanlığı) sınav süreci bilgisi (sınav grup numarası, süreç
  dolma tarihi) girilebiliyor — hem öğrenci sayfasında ilgili eğitim kaydının
  altında, hem de üst menüdeki ayrı **MEB** sayfasında (tüm süreçlerin listesi,
  süresi dolanlar işaretli).

## Bilinen Kapsam Dışı Konular / Sonraki Adımlar

Aşağıdakiler bilinçli olarak bu ilk sürümün kapsamı dışında bırakıldı; şema
bunlara hazır (gerekli tablolar mevcut) ama arayüz/iş mantığı henüz yazılmadı:

- **Sözleşme/PDF üretimi**: `ContractTemplate` modeli hazır ama şablon
  düzenleme ve PDF çıktısı arayüzü yok.
- **Dosya/belge yükleme**: `StudentDocument`/`StaffDocument` tabloları var
  ama gerçek dosya depolama (S3/Blob) entegre edilmedi.
- **Yoklama (Attendance)**: `CourseSession` ve `Attendance` tabloları hazır;
  takvimde dersler ders programından "sanal" olarak hesaplanıyor ama somut
  oturum/yoklama kaydı tutulmuyor.
- **Ayarlar modülü**: Kurum bilgisi, kullanıcı/rol yönetimi arayüzü henüz
  yok (roller ve izinler şu an sadece `prisma/seed.ts` üzerinden yönetiliyor).
- **Bildirimler**: Vade yaklaşan taksit, atanan görev gibi otomatik
  bildirimler (e-posta/SMS/sistem içi) henüz yok.

## Bilinen Bir Next.js Davranışı

Bazı silme işlemlerinden hemen sonra (aynı sayfaya yönlendirildiğinde) arayüz
bir an için eski veriyi gösterebilir; bu, Next.js'in kendi belgelerinde
belirtilen, `revalidatePath`'in "bir sonraki ziyarette" tam etkili olduğu
bilinen geçici bir davranıştır (bkz. Next.js `revalidatePath` dokümantasyonu).
Sayfa yenilendiğinde veya farklı bir sayfaya geçilip geri dönüldüğünde veri
her zaman doğru görünür; veritabanı katmanı bu durumdan etkilenmez.
