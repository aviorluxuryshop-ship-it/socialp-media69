/**
 * Device quality tiers. Chosen once at start-up from coarse capability hints,
 * then adjusted at runtime by the frame-time governor (see core/governor.ts).
 */

export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  pixelRatio: number;
  shadowMapSize: number;
  shadows: boolean;
  antialias: boolean;
  /** radius (m) within which city chunks are kept at full detail */
  cityDetailRadius: number;
  /** radius (m) within which city chunks are loaded at all */
  cityLoadRadius: number;
  /** seat blocks closer than this use the detailed seat mesh */
  seatDetailDistance: number;
  trees: boolean;
  bloom: boolean;
  /** ms of main-thread time per frame the streamer may spend building chunks */
  streamBudgetMs: number;
}

export function detectQuality(): QualitySettings {
  const params = new URLSearchParams(location.search);
  const forced = params.get('q') as QualityTier | null;
  const ua = navigator.userAgent;
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  const cores = navigator.hardwareConcurrency || 4;
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  let tier: QualityTier = mobile ? (cores >= 8 && mem >= 6 ? 'medium' : 'low') : cores >= 8 ? 'high' : 'medium';
  if (forced === 'low' || forced === 'medium' || forced === 'high') tier = forced;
  return settingsFor(tier);
}

export function settingsFor(tier: QualityTier): QualitySettings {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  switch (tier) {
    case 'high':
      return {
        tier,
        pixelRatio: dpr,
        shadowMapSize: 4096,
        shadows: true,
        antialias: true,
        cityDetailRadius: 900,
        cityLoadRadius: 2600,
        seatDetailDistance: 34,
        trees: true,
        bloom: true,
        streamBudgetMs: 6,
      };
    case 'medium':
      return {
        tier,
        pixelRatio: dpr,
        shadowMapSize: 4096,
        shadows: true,
        antialias: true,
        cityDetailRadius: 650,
        cityLoadRadius: 2000,
        seatDetailDistance: 26,
        trees: true,
        bloom: false,
        streamBudgetMs: 4,
      };
    default:
      return {
        tier,
        pixelRatio: Math.min(dpr, 1.75),
        shadowMapSize: 2048,
        shadows: true,
        antialias: true,
        cityDetailRadius: 450,
        cityLoadRadius: 1500,
        seatDetailDistance: 18,
        trees: false,
        bloom: false,
        streamBudgetMs: 3,
      };
  }
}
