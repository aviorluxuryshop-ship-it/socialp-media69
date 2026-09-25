const roadmap = [
  { faz: 'Faz 0', ad: 'Altyapı: Auth, Roller/Yetkiler, temel layout, Ayarlar', durum: 'Devam ediyor' },
  { faz: 'Faz 1', ad: 'Personeller', durum: 'Bekliyor' },
  { faz: 'Faz 2', ad: 'Eğitimler (Kurslar + Gruplar + Ders Programı)', durum: 'Bekliyor' },
  { faz: 'Faz 3', ad: 'Öğrenciler', durum: 'Bekliyor' },
  { faz: 'Faz 4', ad: 'Hesaplarım (Ödeme / Cari Hesap / Kasa-Banka-POS)', durum: 'Bekliyor' },
  { faz: 'Faz 5', ad: 'Takvim & Planlama', durum: 'Bekliyor' },
  { faz: 'Faz 6', ad: 'Masraflar', durum: 'Bekliyor' },
  { faz: 'Faz 7', ad: 'Görevler', durum: 'Bekliyor' },
  { faz: 'Faz 8', ad: 'Raporlar', durum: 'Bekliyor' },
  { faz: 'Faz 9', ad: 'Dashboard (nihai hali)', durum: 'Bekliyor' },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold text-[var(--color-royal)]">Akademi Royal — Yönetim Paneli</h1>
      <p className="mt-2 text-[var(--color-royal-dim)]">Proje iskeleti kuruldu. Geliştirme fazlar halinde ilerliyor.</p>

      <ol className="mt-8 divide-y divide-[var(--color-mist)] rounded-lg border border-[var(--color-mist)]">
        {roadmap.map((item) => (
          <li key={item.faz} className="flex items-center justify-between px-4 py-3">
            <span>
              <span className="font-medium">{item.faz}</span> — {item.ad}
            </span>
            <span className="text-sm text-[var(--color-royal-dim)]">{item.durum}</span>
          </li>
        ))}
      </ol>
    </main>
  );
}
