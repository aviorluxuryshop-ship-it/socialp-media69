import type { SearchDoc } from '@/lib/search';
import { MEALS } from './nutrition';
import { NUTRITION_SEARCH } from './nutrition-search';
import { PLAYER_KIND_NAME } from './player-types';
import { PLAYERS } from './players';
import { POSITION_BY_ID } from './positions';
import { VIDEOS, VIDEO_TOPIC_NAME } from './videos';
import { FIELD_TESTS } from './tests';

// Video, oyuncu analizi, beslenme ve saha testi arama kayıtları.
export const EXTRA_DOCS: SearchDoc[] = [
  ...VIDEOS.map((v): SearchDoc => ({
    k: 'video',
    t: v.title,
    d: v.summary,
    u: `/videolar/?q=${encodeURIComponent(v.title.slice(0, 40))}`,
    x: `${v.author} ${VIDEO_TOPIC_NAME[v.topic]} ${v.lang === 'tr' ? 'türkçe' : 'ingilizce'}`,
    c: VIDEO_TOPIC_NAME[v.topic],
  })),
  ...PLAYERS.map((p): SearchDoc => ({
    k: 'oyuncu',
    t: `${p.name} oyun analizi`,
    d: p.tagline,
    u: `/analiz/oyuncular/${p.id}/`,
    x: `${p.role} ${POSITION_BY_ID[p.pos].name} ${PLAYER_KIND_NAME[p.kind]} pozisyon alma topsuz hareket pas tercihleri`,
    a: [p.name],
  })),
  ...MEALS.map((m): SearchDoc => ({
    k: 'yiyecek',
    t: m.name,
    d: m.why,
    u: '/beslenme/',
    x: m.parts.join(' '),
  })),
  ...NUTRITION_SEARCH,
  ...FIELD_TESTS.map((t): SearchDoc => ({
    k: 'sayfa',
    t: `${t.name} testi`,
    d: `Saha testi: ${t.group}. Ölçüm düzeni ve kayıt.`,
    u: '/analiz/performans/',
    x: t.how.join(' '),
    a: ['test', 'ölçüm'],
  })),
];
