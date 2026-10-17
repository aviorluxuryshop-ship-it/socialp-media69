import type { PositionId } from '@/lib/types';
import type { VideoTopic } from './video-topics';

/**
 * Oyuncu analizleri — EĞİTİM AMAÇLI YORUMDUR.
 * Sayı, istatistik, ödül, transfer, maaş ya da özel hayat bilgisi verilmez; yalnızca
 * geniş çevrelerce kabul gören oyun özellikleri, okunan kaynaklardan yeniden anlatılır
 * ve kendi oyununa nasıl taşınacağı gösterilir. Her oyuncunun `sources` listesi, gerçekten
 * açılıp okunmuş sayfalardır; kaynağı olmayan bir şey yazılmaz.
 */

export type PlayerKind = 'oyun-kurucu' | 'yaratici' | 'denge' | 'ucu' | 'defans' | 'kaleci';

export const PLAYER_KIND_NAME: Record<PlayerKind, string> = {
  'oyun-kurucu': 'Oyun kurucu',
  yaratici: 'Yaratıcı',
  denge: 'Denge ve top kazanma',
  ucu: 'Kanat ve forvet',
  defans: 'Defans ve bek',
  kaleci: 'Kaleci',
};

export const PLAYER_KIND_ORDER: PlayerKind[] = ['oyun-kurucu', 'yaratici', 'denge', 'ucu', 'defans', 'kaleci'];

export interface PlayerSource {
  title: string;
  /** Açılıp okunmuş sayfanın adresi (https) */
  url: string;
  /** Sayfanın okunduğu gün (YYYY-AA-GG) */
  accessed: string;
  /** Bu kaynaktan ne alındığı (Türkçe, kısa) */
  note: string;
}

export interface PlayerExtraBlock {
  title: string;
  items: string[];
}

/** Eski (ilk sürüm) alanlar — taşınarak korunur */
export interface PlayerBase {
  id: string;
  name: string;
  pos: PositionId;
  /** kısa rol etiketi */
  role: string;
  tagline: string;
  /** Oyun tarzı özeti */
  style: string;
  /** Hücum ve topla oyun */
  onBall: string[];
  /** Topsuz hareket */
  offBall: string[];
  /** Savunma ve top kazanma */
  defending: string[];
  /** Kendi oyununa taşı */
  lessons: string[];
  /** İzlerken bak */
  watch: string[];
  /** kütüphanedeki ilgili teknikler (teknik kimlikleri) */
  techs: string[];
  /** YouTube arama sorgusu (arama bağlantısı olarak kullanılır) */
  q: string;
}

/** Derinleştirilmiş bölümler */
export interface PlayerDeep {
  kind: PlayerKind;
  /** Pozisyon alma */
  positioning: string[];
  /** Pas tercihleri */
  passing: string[];
  /** Top kontrolü ve ilk dokunuş */
  control: string[];
  /** Karar verme */
  decisions: string[];
  /** Güçlü yanlar */
  strengths: string[];
  /** Sınırlılıklar ve taklit ederken dikkat */
  limits: string[];
  /** Benzer oyuncular (bu sayfadaki oyuncu kimlikleri) */
  similar: string[];
  /** Kaynaklar: açılıp okunmuş sayfalar */
  sources: PlayerSource[];
  /** İlgili videolar: yalnızca kütüphanedeki doğrulanmış, gömülebilir videoların kimlikleri (3–6) */
  videos: string[];
  /** Video penceresinde "Bu videoda bak": video konusuna göre bu oyuncuda neye bakılacağı */
  videoLooks: Partial<Record<VideoTopic, string>>;
  /** Ek bloklar (en kapsamlı analizlerde) */
  extra?: PlayerExtraBlock[];
  /** En kapsamlı analiz */
  deep?: boolean;
}

export type PlayerAnalysis = PlayerBase & PlayerDeep;

/** Sayfadaki bölümler (içindekiler ve numaralama bu sıraya göre) */
export const PLAYER_SECTIONS = [
  { id: 'ozet', title: 'Oyun tarzı özeti' },
  { id: 'pozisyon', title: 'Pozisyon alma' },
  { id: 'topsuz', title: 'Topsuz hareket' },
  { id: 'pas', title: 'Pas tercihleri' },
  { id: 'kontrol', title: 'Top kontrolü ve ilk dokunuş' },
  { id: 'hucum', title: 'Hücum ve topla oyun' },
  { id: 'savunma', title: 'Savunma ve top kazanma' },
  { id: 'karar', title: 'Karar verme' },
  { id: 'guclu', title: 'Güçlü yanlar ve sınırlılıklar' },
  { id: 'tasi', title: 'Kendi oyununa taşı' },
  { id: 'izle', title: 'İzlerken bak' },
  { id: 'videolar', title: 'Videolar' },
  { id: 'benzer', title: 'Benzer oyuncular' },
  { id: 'kaynaklar', title: 'Kaynaklar' },
] as const;
