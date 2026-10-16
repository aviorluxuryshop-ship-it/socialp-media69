import { TECHNIQUES } from '@/data';
import { EXERCISES, EXCAT_NAME, MUSCLE_NAME } from '@/data/exercises';
import { TACTICS } from '@/data/tactics';
import { POSITION_PROFILES } from '@/data/positions';
import { CAT_BY_ID } from '@/data/categories';
import type { SearchDoc } from '@/lib/search';

export const dynamic = 'force-static';

const PAGES: SearchDoc[] = [
  { k: 'sayfa', t: 'Teknik kütüphanesi', d: 'Tüm futbol teknikleri: pas, şut, kontrol, çalım, kafa, kalecilik ve daha fazlası.', u: '/teknikler/', a: ['teknikler', 'kütüphane', 'tekniğ'] },
  { k: 'sayfa', t: 'Top kontrolü ve topsuz hareketler', d: 'İlk temas, yönlü kontrol, boş alan, koşu zamanlaması ve pas açısı.', u: '/top-kontrolu/', a: ['ilk temas', 'topsuz koşu', 'boş alan'] },
  { k: 'sayfa', t: 'Taktik ve Futbol IQ', d: 'Pres, geçişler, savunma yerleşimi ve karar verme.', u: '/taktik/', a: ['taktik', 'iq', 'pres'] },
  { k: 'test', t: 'Futbol IQ testi', d: 'Maç durumlarında karar verin; doğru kararı saha üzerinde izleyin.', u: '/taktik/test/', a: ['quiz', 'test', 'soru', 'karar'] },
  { k: 'sayfa', t: 'Taktik tahtası', d: 'Oyuncuları sürükleyin, pas ve koşu yollarını adım adım oynatın.', u: '/taktik-tahtasi/', a: ['tahta', 'çizim', 'diyagram', 'saha çizimi'] },
  { k: 'sayfa', t: 'Pozisyonlar', d: 'Kaleci, stoper, bek, ön libero, orta saha, on numara, kanat, santrfor.', u: '/pozisyonlar/', a: ['pozisyon', 'mevki'] },
  { k: 'sayfa', t: 'Fiziksel gelişim', d: 'Sürat, çeviklik, kuvvet, denge ve dayanıklılık egzersizleri.', u: '/fiziksel/', a: ['kondisyon', 'antrenman', 'kas'] },
  { k: 'sayfa', t: 'Kişisel antrenman programı', d: 'Yaşa, seviyeye ve hedefe göre esnek haftalık program.', u: '/program/', a: ['program', 'plan', 'takvim', 'antrenman planı'] },
  { k: 'sayfa', t: 'Beslenme ve toparlanma', d: 'Antrenman öncesi-sonrası beslenme, sıvı, pratik öğünler ve alternatifler.', u: '/beslenme/', a: ['yemek', 'diyet', 'su', 'protein'] },
  { k: 'sayfa', t: 'Performans analizi', d: 'Antrenman geçmişi, test sonuçları ve teknik seviye gelişimi.', u: '/analiz/performans/', a: ['istatistik', 'gelişim', 'ilerleme', 'test sonuçları'] },
  { k: 'sayfa', t: 'Video analizi', d: 'Kendi videonuzu yükleyin; kare kare ilerleyin, çizin, not alın.', u: '/analiz/video/', a: ['video analiz', 'çizim', 'işaretleme'] },
  { k: 'sayfa', t: 'Oyuncu analizi', d: 'Profesyonel oyuncuların oyun tarzı, pas tercihleri ve topsuz hareketleri.', u: '/analiz/oyuncular/', a: ['profesyonel oyuncu', 'futbolcu analizi'] },
  { k: 'sayfa', t: 'Videolar', d: 'Konuya, pozisyona ve seviyeye göre doğrulanmış futbol videoları.', u: '/videolar/', a: ['video', 'izle', 'youtube'] },
  { k: 'sayfa', t: 'Panelim ve verilerim', d: 'Profil, yedek alma/geri yükleme ve kaynaklar.', u: '/profil/', a: ['profil', 'yedek', 'veri', 'hesap'] },
];

export async function GET() {
  const docs: SearchDoc[] = [
    ...PAGES,
    ...TECHNIQUES.map((t): SearchDoc => ({
      k: 'teknik',
      t: t.name,
      d: t.summary,
      u: `/teknikler/${t.id}/`,
      x: `${t.contact} ${t.purpose} ${t.sub} ${t.en ?? ''}`,
      a: t.aliases,
      c: CAT_BY_ID[t.cat].name,
    })),
    ...EXERCISES.map((e): SearchDoc => ({
      k: 'egzersiz',
      t: e.name,
      d: e.why,
      u: `/fiziksel/${e.id}/`,
      x: e.muscles.map((m) => MUSCLE_NAME[m]).join(' '),
      c: EXCAT_NAME[e.cat],
    })),
    ...TACTICS.map((t): SearchDoc => ({ k: 'taktik', t: t.title, d: t.summary, u: `/taktik/${t.id}/`, a: t.aliases })),
    ...POSITION_PROFILES.map((p): SearchDoc => ({ k: 'pozisyon', t: p.name, d: p.tagline, u: `/pozisyonlar/${p.id}/`, x: p.think.join(' ') })),
  ];
  const extra = await import('@/data/search-extra');
  docs.push(...extra.EXTRA_DOCS);
  return Response.json(docs);
}
