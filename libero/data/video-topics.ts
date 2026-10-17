/**
 * Video konuları, grupları ve sıralama — hafif modül (veri/teknik içe aktarmaz).
 * İstemci bileşenleri bunu kullanır; ağır `data/videos.ts` yalnızca sunucuda değerlendirilir.
 */

export type VideoTopic =
  | 'pas' | 'sut' | 'kontrol' | 'surme' | 'kafa' | 'bitiricilik' | 'hucum' | 'savunma' | 'kalecilik' | 'duran' | 'topsuz'
  | 'taktik' | 'fiziksel' | 'onleme';

export const VIDEO_TOPIC_NAME: Record<VideoTopic, string> = {
  pas: 'Pas',
  sut: 'Şut ve vuruşlar',
  kontrol: 'Top kontrolü',
  surme: 'Top sürme ve çalım',
  kafa: 'Kafa vuruşu',
  bitiricilik: 'Bitiricilik',
  hucum: 'Hücum oyunu',
  savunma: 'Savunma',
  kalecilik: 'Kalecilik',
  duran: 'Duran toplar',
  topsuz: 'Topsuz hareketler',
  taktik: 'Taktik',
  fiziksel: 'Fiziksel gelişim',
  onleme: 'Isınma ve sakatlık önleme',
};

export type VideoGroupId = 'teknik' | 'oyun' | 'kaleci' | 'fiziksel';

export interface VideoGroup {
  id: VideoGroupId;
  name: string;
  /** Sekme altında gösterilen kısa açıklama */
  blurb: string;
  /** Gösterim sırası bu dizinin sırasıdır */
  topics: VideoTopic[];
}

export const VIDEO_GROUPS: VideoGroup[] = [
  {
    id: 'teknik',
    name: 'Teknik',
    blurb: 'Topla yapılan temel beceriler: pas, şut, kontrol, sürme, kafa ve bitiricilik.',
    topics: ['pas', 'sut', 'kontrol', 'surme', 'kafa', 'bitiricilik'],
  },
  {
    id: 'oyun',
    name: 'Oyun ve taktik',
    blurb: 'Takım oyunu: hücum, savunma, topsuz hareketler, duran toplar ve taktik.',
    topics: ['hucum', 'savunma', 'topsuz', 'duran', 'taktik'],
  },
  {
    id: 'kaleci',
    name: 'Kaleci',
    blurb: 'Kalecilik teknikleri ve kaleci antrenmanları.',
    topics: ['kalecilik'],
  },
  {
    id: 'fiziksel',
    name: 'Fiziksel',
    blurb: 'Kuvvet, hız, dayanıklılık; ısınma ve sakatlıktan korunma.',
    topics: ['fiziksel', 'onleme'],
  },
];

export const VIDEO_GROUP_BY_ID = Object.fromEntries(VIDEO_GROUPS.map((g) => [g.id, g])) as Record<VideoGroupId, VideoGroup>;

/** Konu sırası (gruplara göre): sıralama ve çip dizilimi için */
export const VIDEO_TOPIC_ORDER: VideoTopic[] = VIDEO_GROUPS.flatMap((g) => g.topics);

export const GROUP_OF_TOPIC = Object.fromEntries(VIDEO_GROUPS.flatMap((g) => g.topics.map((t) => [t, g.id]))) as Record<VideoTopic, VideoGroupId>;

export const isVideoTopic = (x: unknown): x is VideoTopic => typeof x === 'string' && x in VIDEO_TOPIC_NAME;
export const isVideoGroup = (x: unknown): x is VideoGroupId => typeof x === 'string' && VIDEO_GROUPS.some((g) => g.id === x);
