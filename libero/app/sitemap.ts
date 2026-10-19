import type { MetadataRoute } from 'next';
import { TECHNIQUES } from '@/data';
import { EXERCISES } from '@/data/exercises';
import { PLAYERS } from '@/data/players';
import { POSITION_PROFILES } from '@/data/positions';
import { TACTICS } from '@/data/tactics';

export const dynamic = 'force-static';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://libero.example').replace(/\/$/, '');

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [
    '/', '/teknikler/', '/top-kontrolu/', '/taktik/', '/taktik/test/', '/taktik-tahtasi/', '/pozisyonlar/', '/fiziksel/', '/program/',
    '/beslenme/', '/analiz/performans/', '/analiz/video/', '/analiz/oyuncular/', '/videolar/', '/profil/',
  ];
  const dyn = [
    ...TECHNIQUES.map((t) => `/teknikler/${t.id}/`),
    ...TACTICS.map((t) => `/taktik/${t.id}/`),
    ...POSITION_PROFILES.map((p) => `/pozisyonlar/${p.id}/`),
    ...EXERCISES.map((e) => `/fiziksel/${e.id}/`),
    ...PLAYERS.map((p) => `/analiz/oyuncular/${p.id}/`),
  ];
  return [...pages, ...dyn].map((p) => ({ url: `${SITE}${p}` }));
}
