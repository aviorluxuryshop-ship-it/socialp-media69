import type { Video } from '@/data/video-build';

/**
 * Video penceresindeki dürüstlük rozetleri — yalnızca doğrulama verisinin desteklediği şeyi söyler.
 * • Türkçe altyazı iddiası yalnızca `sub === 'tr-ceviri'` iken (YouTube altyazı bilgisi bunu gösteriyorsa) yapılır.
 * • İngilizce videoda altyazı doğrulanamadıysa bunu açıkça yazar.
 * • Oynatıcı her zaman YouTube'un resmî gömme oynatıcısıdır; video kopyalanmaz.
 */

export type BadgeTone = 'accent' | 'sky' | 'gold' | 'flare' | 'plain';

export interface VideoBadge {
  id: 'lang' | 'sub' | 'embed' | 'summary';
  tone: BadgeTone;
  label: string;
  /** Rozetin altında / başlığında gösterilen kısa açıklama */
  hint?: string;
}

/** '2026-10-16' → '16.10.2026'; bozuksa boş metin */
export function trDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

export function subtitleBadge(v: Pick<Video, 'lang' | 'sub'>): VideoBadge | null {
  if (v.lang === 'tr') return null; // Türkçe anlatımda altyazı iddiası yok
  if (v.sub === 'tr-ceviri') {
    return {
      id: 'sub',
      tone: 'sky',
      label: 'Türkçe altyazı: otomatik çeviriyle açılabilir',
      hint: 'Oynatıcıda Altyazı (CC) → Ayarlar → Altyazılar → Otomatik çeviri → Türkçe. Çeviri YouTube’a aittir; hatalı olabilir.',
    };
  }
  return {
    id: 'sub',
    tone: 'flare',
    label: 'Türkçe özet var; Türkçe altyazı doğrulanamadı',
    hint: 'Altyazı seçenekleri oynatıcıda görünüyorsa deneyebilirsin; olup olmadığını bu site doğrulayamadı.',
  };
}

export function videoBadges(v: Video): VideoBadge[] {
  const out: VideoBadge[] = [
    v.lang === 'tr'
      ? { id: 'lang', tone: 'accent', label: 'Türkçe anlatım' }
      : { id: 'lang', tone: 'gold', label: 'İngilizce anlatım' },
  ];
  const sub = subtitleBadge(v);
  if (sub) out.push(sub);
  const d = trDate(v.verifiedAt);
  out.push({
    id: 'embed',
    tone: 'plain',
    label: d ? `Gömülebilirlik doğrulandı · ${d}` : 'Gömülebilirlik doğrulandı',
    hint: 'Varlığı ve gömülebilirliği YouTube’un resmî oEmbed bağlantısıyla denetlendi; video kopyalanmaz, resmî oynatıcıyla gösterilir.',
  });
  return out;
}
