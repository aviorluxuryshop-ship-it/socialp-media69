import type { SearchDoc } from '@/lib/search';

// Beslenme rehberinin bölümlerine doğrudan bağlantılar (arama paleti)
const D = (t: string, d: string, id: string, a: string[]): SearchDoc => ({ k: 'sayfa', t, d, u: `/beslenme/#${id}`, a, c: 'Beslenme' });

export const NUTRITION_SEARCH: SearchDoc[] = [
  D('Maç günü beslenme çizelgesi', 'Maç saatini gir; yeme, içme ve dinlenme çizelgeni oluştur ve yazdır.', 'mac-gunu', ['maç günü', 'çizelge', 'kahvaltı', 'maç öncesi']),
  D('Günlük su takibi ve hatırlatıcı', 'Bardak sayacı, son yedi gün ve su içme hatırlatıcısı.', 'sivi', ['su', 'hatırlatıcı', 'sıvı', 'içme']),
  D('İdrar rengi kartı', 'İdrar rengine göre sıvı dengesi ipuçları.', 'sivi', ['idrar', 'dehidrasyon', 'sıvı']),
  D('Futbolcu uykusu: yaşa göre süreler', 'Yaşa göre önerilen uyku süresi, ekran ve kafein.', 'uyku', ['uyku', 'ekran', 'kafein']),
  D('Takviyeler: çocuklar için önerilmez', 'Protein tozu, kreatin, kafein ve enerji içeceği hakkında.', 'takviye', ['takviye', 'protein tozu', 'kreatin', 'enerji içeceği']),
  D('Ramazan ve sporcu', 'Oruç tutan sporcu için kaynaklı ve temkinli bilgi.', 'ramazan', ['oruç', 'sahur', 'iftar', 'ramazan']),
  D('Turnuva ve çoklu maç günü beslenmesi', 'Aynı gün birden çok maçta yeme-içme ve turnuva çantası.', 'turnuva', ['turnuva', 'çoklu maç']),
  D('Dinlenme ve toparlanma: aşırı antrenman, RED-S uyarıları', 'Dinlenme günü, yoğun fikstür ve uyarı işaretleri.', 'uyari', ['aşırı antrenman', 'red-s', 'yorgunluk', 'yeme bozukluğu']),
  D('Haftalık öğün planlayıcı ve alışveriş listesi', 'Haftanı kur, alışveriş listeni çıkar ve yazdır.', 'planlayici', ['alışveriş', 'öğün planı', 'liste']),
  D('Örnek öğünler ve günlük planlar (yaş grubuna göre)', 'Antrenman, maç ve dinlenme günü için Türk mutfağından örnekler.', 'menuler', ['menü', 'öğün', 'tabak modeli']),
];
