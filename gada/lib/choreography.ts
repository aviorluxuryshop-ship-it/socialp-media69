/**
 * Kutunun sayfa boyunca izlediği yol.
 *
 * Her bölümde bir ya da birkaç `[data-key]` işaretçisi vardır. İşaretçi ekrandayken
 * kutu o anahtarın durumunda bekler; iki işaretçi arasında kaydırırken bir
 * durumdan diğerine yumuşakça geçer. Böylece kutu sayfadan kopmaz: tek bir
 * nesne, tek bir sahnede hareket eder.
 *
 * phi: derece cinsinden dönüş. 0 = ÖN, -90 = SOL, -180 = ARKA, -270 = SAĞ.
 * Şeftali bölümünde kutu hep aynı yöne döner; limona geçtikten sonra ters yöne.
 */
export type CanState = {
  /** Ekran merkezinden yatay kayma, görüntü genişliğinin oranı */
  x: number
  /** Ekran merkezinden dikey kayma, görüntü yüksekliğinin oranı */
  y: number
  /** Temel kutu yüksekliğine göre ölçek */
  s: number
  /** Dönüş açısı (derece) */
  phi: number
  /** Ürün: 0 şeftali, 1 limon */
  p: number
  /** Opaklık */
  o: number
  /** Ortam rengi: 0 şeftali, 1 nötr, 2 limon */
  e: number
  /** Kutunun (x, y) noktasına oturan yüksekliği: 0 kapak, 1 dip */
  fy: number
}

const S = (o: Partial<CanState>): CanState => ({ x: 0, y: 0, s: 1, phi: 0, p: 0, o: 1, e: 0, fy: 0.5, ...o })

export const KEYS = {
  hero: { d: S({ y: 0.035, phi: -8 }), m: S({ y: -0.035, phi: -8 }) },
  about: { d: S({ x: 0.25, y: 0.02, s: 0.84, phi: 16, e: 0.45 }), m: S({ y: -0.12, s: 0.74, phi: 16, e: 0.45 }) },
  peach: { d: S({ x: -0.2, y: 0.02, s: 1.02, phi: 0, e: 0 }), m: S({ y: -0.1, s: 0.82 }) },
  peachStory: { d: S({ x: 0.23, s: 0.94, phi: -90, e: 0.1 }), m: S({ y: -0.12, s: 0.74, phi: -90, e: 0.1 }) },
  peachIngredients: {
    d: S({ x: 0.24, s: 0.94, phi: -180, e: 0.25 }),
    m: S({ y: -0.12, s: 0.74, phi: -180, e: 0.25 }),
  },
  peachDesign1: {
    d: S({ x: 0.15, y: 0.02, s: 1.62, fy: 0.64, phi: -270, e: 0.3 }),
    m: S({ y: -0.08, s: 1.45, fy: 0.64, phi: -270, e: 0.3 }),
  },
  peachDesign2: {
    d: S({ x: 0.15, y: 0.02, s: 1.78, fy: 0.37, phi: -360, e: 0.35 }),
    m: S({ y: -0.08, s: 1.6, fy: 0.37, phi: -360, e: 0.35 }),
  },
  peachDesign3: {
    d: S({ x: 0.15, y: 0.03, s: 1, phi: -366, e: 0.45 }),
    m: S({ y: -0.06, s: 0.84, phi: -366, e: 0.45 }),
  },
  lemon: { d: S({ x: 0.2, y: 0.02, s: 1.02, phi: -360, p: 1, e: 2 }), m: S({ y: -0.1, s: 0.82, phi: -360, p: 1, e: 2 }) },
  lemonStory: {
    d: S({ x: -0.23, s: 0.94, phi: -270, p: 1, e: 2 }),
    m: S({ y: -0.12, s: 0.74, phi: -270, p: 1, e: 2 }),
  },
  lemonIngredients: {
    d: S({ x: -0.24, s: 0.94, phi: -180, p: 1, e: 1.8 }),
    m: S({ y: -0.12, s: 0.74, phi: -180, p: 1, e: 1.8 }),
  },
  lemonDesign1: {
    d: S({ x: -0.15, y: 0.02, s: 1.6, fy: 0.7, phi: -90, p: 1, e: 1.75 }),
    m: S({ y: -0.08, s: 1.45, fy: 0.7, phi: -90, p: 1, e: 1.75 }),
  },
  lemonDesign2: {
    d: S({ x: -0.15, y: 0.02, s: 1.78, fy: 0.37, phi: 0, p: 1, e: 1.7 }),
    m: S({ y: -0.08, s: 1.6, fy: 0.37, phi: 0, p: 1, e: 1.7 }),
  },
  lemonDesign3: {
    d: S({ x: -0.15, y: 0.03, s: 1, phi: 6, p: 1, e: 1.6 }),
    m: S({ y: -0.06, s: 0.84, phi: 6, p: 1, e: 1.6 }),
  },
  origin: {
    d: S({ x: 0.3, y: 0.12, s: 0.7, phi: 30, p: 1, o: 0, e: 1.2 }),
    m: S({ y: 0.1, s: 0.6, phi: 30, p: 1, o: 0, e: 1.2 }),
  },
  contact: { d: S({ x: 0.3, y: 0.12, s: 0.7, phi: 30, p: 1, o: 0, e: 1 }), m: S({ y: 0.1, s: 0.6, phi: 30, p: 1, o: 0, e: 1 }) },
} satisfies Record<string, { d: CanState; m: CanState }>

export type KeyName = keyof typeof KEYS

/** Açılışta kutu ön yüzüyle başlar: sunucuda çizilen ilk kareyle birebir aynı. */
export const INTRO: { d: CanState; m: CanState } = {
  d: { ...KEYS.hero.d, phi: 0 },
  m: { ...KEYS.hero.m, phi: 0 },
}

type Stop = { from: number; to: number; state: CanState }

const ease = (t: number) => t * t * (3 - 2 * t)

export class Track {
  private stops: Stop[] = []

  /** İşaretçilerin sayfadaki konumlarını ölçer. Yeniden boyutlandırmada tekrar çağrılır. */
  measure(mobile: boolean) {
    const vh = window.innerHeight
    const scroll = window.scrollY
    const stops: Stop[] = []
    document.querySelectorAll<HTMLElement>('[data-key]').forEach((el) => {
      const name = el.dataset.key as KeyName
      const key = KEYS[name]
      if (!key) return
      const r = el.getBoundingClientRect()
      const top = r.top + scroll
      let from = top - vh * 0.25
      let to = top + r.height - vh * 0.75
      if (to < from) from = to = (from + to) / 2
      stops.push({ from, to, state: mobile ? key.m : key.d })
    })
    stops.sort((a, b) => a.from - b.from)
    this.stops = stops
  }

  /** Verilen kaydırma konumundaki hedef durumu yazar. */
  sample(y: number, out: CanState): CanState {
    const s = this.stops
    if (!s.length) return out
    if (y <= s[0].to) return Object.assign(out, s[0].state)
    for (let i = 0; i < s.length - 1; i++) {
      const a = s[i]
      const b = s[i + 1]
      if (y <= a.to) return Object.assign(out, a.state)
      if (y < b.from) {
        const t = ease((y - a.to) / (b.from - a.to))
        for (const k of Object.keys(out) as (keyof CanState)[]) out[k] = a.state[k] + (b.state[k] - a.state[k]) * t
        return out
      }
    }
    return Object.assign(out, s[s.length - 1].state)
  }
}
