// Krampon temas yüzeyi haritası: saf mantık (React yok, tarayıcı yok).
//
// Bir tekniğin temas bölgeleri (FootZone) kramponun hangi görünümünde (üstten, iç yüz, dış yüz,
// topuk/taban) görülür, hangi görünüm ilk açılır, etiketler ve erişilebilirlik metni nasıl kurulur.
// Çizim dosyaları (components/boot/*) ve testler bu modülü ortak kullanır.
import type { FootZone } from '@/data/types';

export type BootView = 'ust' | 'ic' | 'dis' | 'taban';

/** Görünüm sırası; eşitlikte önce gelen seçilir. */
export const VIEW_ORDER: BootView[] = ['ust', 'ic', 'dis', 'taban'];

export const ZONE_ORDER: FootZone[] = ['ustTam', 'ustDis', 'ustIc', 'uc', 'ic', 'dis', 'topuk', 'taban'];

export interface ZoneInfo {
  id: FootZone;
  /** çizim üzerindeki kısa etiket (büyük harfle gösterilir) */
  short: string;
  /** kısa etiketin altındaki ikinci satır (dar ekranda gizlenir) */
  sub?: string;
  /** tam ad */
  label: string;
  /** tek cümlelik açıklama */
  note: string;
}

export const ZONES: Record<FootZone, ZoneInfo> = {
  ustTam: {
    id: 'ustTam',
    sub: 'bağcık',
    short: 'Ayak üstü',
    label: 'Ayak üstü (bağcık)',
    note: 'Bağcık bölgesi: düz ve sert vuruşların yüzeyi.',
  },
  ustDis: {
    id: 'ustDis',
    sub: 'trivela yüzeyi',
    short: 'Üst dış',
    label: 'Üst dış — trivela yüzeyi',
    note: 'Ayak üstünün küçük parmak tarafındaki bölümü (dış ayak üstü); dönüşlü vuruşlar. Dış kenar değildir.',
  },
  ustIc: {
    id: 'ustIc',
    sub: 'iç ayak üstü',
    short: 'Üst iç',
    label: 'Üst iç — iç ayak üstü',
    note: 'Ayak üstünün başparmak tarafındaki bölümü; kavisli ve uzun paslar.',
  },
  uc: {
    id: 'uc',
    short: 'Uç',
    label: 'Uç',
    note: 'Kramponun burnu, parmak ucu bölgesi.',
  },
  ic: {
    id: 'ic',
    sub: 'ayak içi',
    short: 'İç yüz',
    label: 'İç yüz — ayak içi',
    note: 'Ayağın başparmak tarafındaki geniş yan yüzü; en kontrollü temas yüzeyi.',
  },
  dis: {
    id: 'dis',
    short: 'Dış kenar',
    label: 'Dış kenar',
    note: 'Ayağın küçük parmak tarafındaki yan kenarı; ayak üstünün dış bölümü değildir.',
  },
  topuk: {
    id: 'topuk',
    short: 'Topuk',
    label: 'Topuk',
    note: 'Ayağın arka kısmı.',
  },
  taban: {
    id: 'taban',
    short: 'Taban',
    label: 'Taban',
    note: 'Ayağın altı (kramponun tabanı): topu çekme ve yuvarlama.',
  },
};

export interface ViewInfo {
  id: BootView;
  /** sekme etiketi */
  label: string;
  /** başlık altı açıklama */
  caption: string;
  /** aria-label için ad */
  aria: string;
}

export const VIEWS: Record<BootView, ViewInfo> = {
  ust: { id: 'ust', label: 'Üstten', caption: 'üstten görünüm', aria: 'üstten görünüm' },
  ic: { id: 'ic', label: 'İç yüz', caption: 'iç yüz (içeriden) görünümü', aria: 'iç yüz görünümü' },
  dis: { id: 'dis', label: 'Dış yüz', caption: 'dış yüz (dışarıdan) görünümü', aria: 'dış yüz görünümü' },
  taban: { id: 'taban', label: 'Topuk · taban', caption: 'alttan görünüm (taban ve topuk)', aria: 'alttan görünüm, taban ve topuk' },
};

/**
 * Her görünümde seçilebilen (vurgulanabilen) bölgeler.
 *  • Üstten: ayak üstü üç dilim + uç.
 *  • İç yüz: iç yüz + yandan görünen iç ayak üstü.
 *  • Dış yüz: dış kenar + yandan görünen dış ayak üstü.
 *  • Topuk/taban: topuk + taban.
 */
export const VIEW_ZONES: Record<BootView, FootZone[]> = {
  ust: ['ustTam', 'ustDis', 'ustIc', 'uc'],
  ic: ['ic', 'ustIc'],
  dis: ['dis', 'ustDis'],
  taban: ['topuk', 'taban'],
};

export function zonesVisibleIn(view: BootView, foot: readonly FootZone[]): FootZone[] {
  const here = VIEW_ZONES[view];
  return orderZones(foot).filter((z) => here.includes(z));
}

/** Bölgeleri kanonik sıraya koyar, tekrarları atar (yazar sırası korunmaz: etiket sırası sabit olsun). */
export function orderZones(foot: readonly FootZone[]): FootZone[] {
  return ZONE_ORDER.filter((z) => foot.includes(z));
}

/** Tekniğin bölgelerinden en az birinin göründüğü görünümler, sabit sırada. */
export function viewsFor(foot: readonly FootZone[]): BootView[] {
  return VIEW_ORDER.filter((v) => VIEW_ZONES[v].some((z) => foot.includes(z)));
}

/**
 * İlk açılacak görünüm: en çok etkin bölgeyi gösteren; eşitlikte yazarın ilk yazdığı (birincil)
 * bölgeyi gösteren; yine eşitse VIEW_ORDER.
 */
export function primaryView(foot: readonly FootZone[]): BootView {
  const views = viewsFor(foot);
  if (views.length === 0) return 'ust';
  const score = (v: BootView) => VIEW_ZONES[v].filter((z) => foot.includes(z)).length;
  const best = Math.max(...views.map(score));
  const tied = views.filter((v) => score(v) === best);
  if (tied.length === 1) return tied[0];
  const first = foot[0];
  return tied.find((v) => VIEW_ZONES[v].includes(first)) ?? tied[0];
}

/** Bir bölgenin görülebildiği görünümler (sabit sırada). */
export function viewsOfZone(zone: FootZone): BootView[] {
  return VIEW_ORDER.filter((v) => VIEW_ZONES[v].includes(zone));
}

/** Top, bu görünümde hangi bölgeye değsin: görünümde etkin olan, yazarın ilk yazdığı bölge. */
export function ballZone(view: BootView, foot: readonly FootZone[]): FootZone | null {
  for (const z of foot) if (VIEW_ZONES[view].includes(z)) return z;
  return null;
}

export function listTr(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return items.slice(0, -1).join(', ') + ' ve ' + items[items.length - 1];
}

const lower = (s: string) => s.replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');

/** SVG için erişilebilir açıklama (Türkçe). */
export function bootAriaLabel(view: BootView, foot: readonly FootZone[], left: boolean): string {
  const here = zonesVisibleIn(view, foot);
  const side = left ? 'Sol' : 'Sağ';
  const head = `${side} krampon, ${VIEWS[view].aria}.`;
  if (here.length === 0) return `${head} Bu görünümde vurgulanan bölge yok.`;
  return `${head} Vurgulanan temas yüzeyi: ${listTr(here.map((z) => lower(ZONES[z].label)))}.`;
}
