export type Allergen = 'sut' | 'yumurta' | 'gluten' | 'fistik' | 'kuruyemis' | 'balik' | 'soya' | 'susam';

export const ALLERGEN_NAME: Record<Allergen, string> = {
  sut: 'Süt ve süt ürünleri',
  yumurta: 'Yumurta',
  gluten: 'Gluten (buğday, arpa, çavdar)',
  fistik: 'Yer fıstığı',
  kuruyemis: 'Ağaç kuruyemişleri (ceviz, badem, fındık)',
  balik: 'Balık',
  soya: 'Soya',
  susam: 'Susam',
};

export type FoodRole = 'protein' | 'karbonhidrat' | 'meyve' | 'sebze' | 'yag' | 'sut' | 'sivi';

export const ROLE_NAME: Record<FoodRole, string> = {
  protein: 'Protein kaynağı',
  karbonhidrat: 'Karbonhidrat (enerji) kaynağı',
  meyve: 'Meyve',
  sebze: 'Sebze',
  yag: 'Sağlıklı yağ',
  sut: 'Kalsiyum kaynağı (süt grubu)',
  sivi: 'Sıvı',
};

export interface Food {
  id: string;
  name: string;
  role: FoodRole;
  /** daha ince grup: benzerlik hesabı */
  sub: string;
  allergens: Allergen[];
  vegetarian: boolean;
  vegan: boolean;
  /** 1 ekonomik … 3 pahalı */
  cost: 1 | 2 | 3;
  /** antrenman öncesi uygun mu (hafif/sindirimi kolay) */
  pre: boolean;
  /** antrenman sonrası toparlanmaya uygun mu */
  post: boolean;
  /** ürüne göre değişen olası alerjenler: kaçınılıyorsa öneriden çıkarılır, etikete bakılması gerekir */
  mayContain: Allergen[];
  /** yalnızca 18 yaş ve üstü için önerilebilir (çocuk ve ergenlere alternatif olarak sunulmaz) */
  adultOnly: boolean;
  note: string;
}

const F = (
  id: string,
  name: string,
  role: FoodRole,
  sub: string,
  o: { al?: Allergen[]; may?: Allergen[]; adult?: boolean; veg?: boolean; vegan?: boolean; cost?: 1 | 2 | 3; pre?: boolean; post?: boolean; note: string },
): Food => ({
  id,
  name,
  role,
  sub,
  allergens: o.al ?? [],
  vegetarian: o.veg ?? true,
  vegan: o.vegan ?? ((o.veg ?? true) && !(o.al ?? []).some((a) => a === 'sut' || a === 'yumurta')),
  cost: o.cost ?? 2,
  pre: o.pre ?? false,
  post: o.post ?? true,
  mayContain: o.may ?? [],
  adultOnly: o.adult ?? false,
  note: o.note,
});

const MEAT = { veg: false, vegan: false } as const;

export const FOODS: Food[] = [
  // Protein: hayvansal
  F('tavuk', 'Tavuk göğsü', 'protein', 'hayvansal', { ...MEAT, cost: 2, note: 'Yağı az, protein bakımından zengin; ızgara ya da haşlama tercih edin.' }),
  F('hindi', 'Hindi eti', 'protein', 'hayvansal', { ...MEAT, cost: 2, note: 'Tavuğa benzer, yağı az protein kaynağı.' }),
  F('dana', 'Dana eti / kıyma (az yağlı)', 'protein', 'hayvansal', { ...MEAT, cost: 3, note: 'Protein, demir ve çinko sağlar; az yağlı seçin.' }),
  F('balik', 'Balık (hamsi, levrek, somon)', 'protein', 'hayvansal', { ...MEAT, al: ['balik'], cost: 3, note: 'Protein ve yararlı yağlar.' }),
  F('ton', 'Ton balığı (konserve)', 'protein', 'hayvansal', { ...MEAT, al: ['balik'], cost: 2, note: 'Pratik protein; salata ya da sandviçle.' }),
  F('yumurta', 'Yumurta', 'protein', 'hayvansal', { veg: true, vegan: false, al: ['yumurta'], cost: 1, pre: true, note: 'Ekonomik, tam protein kaynağı; haşlanmış ya da omlet.' }),
  // Protein: süt grubu
  F('lor', 'Lor / süzme peynir', 'protein', 'sut-proteini', { al: ['sut'], cost: 1, note: 'Yüksek protein, düşük yağ.' }),
  F('yogurt', 'Yoğurt', 'sut', 'sut', { al: ['sut'], cost: 1, pre: true, note: 'Protein ve kalsiyum; meyve ya da bal ile.' }),
  F('ayran', 'Ayran', 'sivi', 'sut-sivi', { al: ['sut'], cost: 1, pre: true, note: 'Sıvı, tuz ve protein; antrenman sonrası için pratik.' }),
  F('sut', 'Süt', 'sut', 'sut', { al: ['sut'], cost: 1, pre: true, note: 'Protein, kalsiyum, sıvı.' }),
  F('kefir', 'Kefir', 'sut', 'sut', { al: ['sut'], cost: 2, note: 'Fermente süt ürünü; protein ve kalsiyum.' }),
  F('beyaz-peynir', 'Beyaz peynir', 'sut', 'sut', { al: ['sut'], cost: 2, note: 'Protein ve kalsiyum; tuzu yüksek olabilir, ölçülü tüketin.' }),
  F('bitkisel-sut', 'Bitkisel süt (kalsiyum ilaveli)', 'sut', 'sut-alternatif', { al: [], may: ['soya', 'kuruyemis', 'gluten'], vegan: true, cost: 2, note: 'Soya, badem ya da yulaf bazlı olabilir: etiketten içeriği ve kalsiyum ilavesini kontrol edin. Süt alerjisi ya da vegan beslenme için.' }),
  // Protein: bitkisel
  F('mercimek', 'Mercimek', 'protein', 'bitkisel', { cost: 1, note: 'Protein, lif ve demir; çorba ya da yemek.' }),
  F('nohut', 'Nohut', 'protein', 'bitkisel', { cost: 1, note: 'Protein ve lif; yemek, salata ya da humus.' }),
  F('kuru-fasulye', 'Kuru fasulye', 'protein', 'bitkisel', { cost: 1, post: true, note: 'Protein ve karbonhidrat birlikte; pilavla birlikte dengeli.' }),
  F('tofu', 'Tofu', 'protein', 'bitkisel', { al: ['soya'], cost: 2, note: 'Bitkisel protein; soya alerjisi olanlara uygun değil.' }),
  F('humus', 'Humus', 'protein', 'bitkisel', { al: ['susam'], cost: 2, note: 'Nohut + tahin: protein ve yağ.' }),
  // Kuruyemiş / yağ
  F('fistik-ezmesi', 'Fıstık ezmesi', 'yag', 'ezme', { al: ['fistik'], cost: 2, pre: true, note: 'Enerji yoğun; ekmek ya da muzla küçük porsiyon.' }),
  F('tahin', 'Tahin (susam ezmesi)', 'yag', 'ezme', { al: ['susam'], cost: 2, note: 'Yağ ve kalsiyum; pekmezle ya da ekmeğe sürerek.' }),
  F('badem', 'Badem', 'yag', 'kuruyemis', { al: ['kuruyemis'], cost: 3, note: 'Yararlı yağlar ve protein; avuç içi kadar.' }),
  F('ceviz', 'Ceviz', 'yag', 'kuruyemis', { al: ['kuruyemis'], cost: 3, note: 'Omega-3 yağ asitleri; küçük bir avuç.' }),
  F('findik', 'Fındık', 'yag', 'kuruyemis', { al: ['kuruyemis'], cost: 2, note: 'Yararlı yağlar; küçük bir avuç.' }),
  F('aycicegi', 'Ay çekirdeği içi / kabak çekirdeği', 'yag', 'tohum', { cost: 1, note: 'Ağaç kuruyemişi alerjisi olanlara alternatif; yağ ve mineral.' }),
  F('zeytinyagi', 'Zeytinyağı', 'yag', 'yag', { cost: 2, note: 'Salata ve yemeklerde yararlı yağ kaynağı.' }),
  F('zeytin', 'Zeytin', 'yag', 'yag', { cost: 1, note: 'Kahvaltıda yağ kaynağı; tuzu yüksek olabilir.' }),
  F('avokado', 'Avokado', 'yag', 'yag', { cost: 3, note: 'Yararlı yağlar; ekmeğe ya da salataya.' }),
  // Karbonhidrat
  F('pirinc', 'Pirinç pilavı', 'karbonhidrat', 'tahil', { cost: 1, pre: true, note: 'Sindirimi kolay enerji; maçtan önce uygun. Şehriyeli pilavda gluten vardır.' }),
  F('bulgur', 'Bulgur pilavı', 'karbonhidrat', 'tahil', { al: ['gluten'], cost: 1, pre: true, note: 'Lif ve enerji; geleneksel tam tahıl.' }),
  F('makarna', 'Makarna', 'karbonhidrat', 'tahil', { al: ['gluten'], cost: 1, pre: true, note: 'Antrenman/maç öncesi klasik enerji kaynağı.' }),
  F('tam-bugday-ekmek', 'Tam buğday ekmeği', 'karbonhidrat', 'ekmek', { al: ['gluten'], cost: 1, pre: true, note: 'Lifli enerji kaynağı.' }),
  F('lavas', 'Lavaş / tam buğday dürüm', 'karbonhidrat', 'ekmek', { al: ['gluten'], cost: 1, pre: true, note: 'Pratik; içine protein ve sebze koyun.' }),
  F('simit', 'Simit', 'karbonhidrat', 'ekmek', { al: ['gluten', 'susam'], cost: 1, pre: true, note: 'Pratik atıştırmalık; peynir ya da yoğurtla dengeleyin.' }),
  F('yulaf', 'Yulaf ezmesi', 'karbonhidrat', 'tahil', { al: ['gluten'], cost: 1, pre: true, note: 'Lifli, uzun süre doyurur. Gluten alerjisinde ya da çölyakta “glutensiz” etiketli olanı seçin; hekimin planı geçerlidir.' }),
  F('patates', 'Patates (haşlama / fırın)', 'karbonhidrat', 'yumru', { cost: 1, pre: true, note: 'Gluten içermez; sindirimi kolay enerji.' }),
  F('tatli-patates', 'Tatlı patates', 'karbonhidrat', 'yumru', { cost: 2, pre: true, note: 'Karbonhidrat ve vitamin; gluten içermez.' }),
  F('misir', 'Mısır', 'karbonhidrat', 'tahil', { cost: 1, note: 'Gluten içermez; enerji ve lif.' }),
  F('kinoa', 'Kinoa', 'karbonhidrat', 'tahil', { cost: 3, note: 'Gluten içermez; bitkisel protein de sağlar.' }),
  // Meyve
  F('muz', 'Muz', 'meyve', 'hizli-enerji', { cost: 1, pre: true, note: 'Antrenman öncesi/sonrası pratik ve hızlı enerji.' }),
  F('elma', 'Elma', 'meyve', 'meyve', { cost: 1, note: 'Lifli, taşınması kolay.' }),
  F('portakal', 'Portakal / mandalina', 'meyve', 'meyve', { cost: 1, note: 'C vitamini ve sıvı.' }),
  F('uzum', 'Üzüm', 'meyve', 'hizli-enerji', { cost: 2, pre: true, note: 'Hızlı enerji.' }),
  F('bal', 'Bal', 'karbonhidrat', 'seker', { vegan: false, cost: 2, pre: true, note: 'Hızlı enerji; ölçülü, bir kaşık kadar.' }),
  F('pekmez', 'Pekmez (üzüm / dut)', 'karbonhidrat', 'seker', { cost: 1, pre: true, note: 'Hızlı enerji ve mineral; tahinle ya da ekmekle ölçülü.' }),
  F('hurma', 'Hurma', 'meyve', 'hizli-enerji', { cost: 2, pre: true, note: 'Yoğun ve hızlı enerji; küçük porsiyon.' }),
  F('kuru-kayisi', 'Kuru kayısı', 'meyve', 'kuru-meyve', { cost: 2, note: 'Enerji ve potasyum; küçük bir avuç.' }),
  F('cilek', 'Çilek / meyve karışımı', 'meyve', 'meyve', { cost: 2, note: 'Vitamin ve antioksidan; yoğurt ya da yulafa eklenir.' }),
  // Sebze
  F('domates', 'Domates / salatalık', 'sebze', 'sebze', { cost: 1, note: 'Sıvı ve vitamin; kahvaltıya ve sandviçe.' }),
  F('yesillik', 'Yeşil yapraklılar (ıspanak, marul)', 'sebze', 'sebze', { cost: 1, note: 'Vitamin ve mineral.' }),
  F('brokoli', 'Brokoli / karnabahar', 'sebze', 'sebze', { cost: 2, note: 'Vitamin ve lif.' }),
  F('havuc', 'Havuç', 'sebze', 'sebze', { cost: 1, note: 'Atıştırmalık, vitamin.' }),
  // Sıvı
  F('su', 'Su', 'sivi', 'su', { cost: 1, pre: true, note: 'Temel sıvı kaynağı; gün boyunca düzenli.' }),
  F('izotonik', 'Elektrolitli spor içeceği', 'sivi', 'spor-icecegi', { adult: true, cost: 2, note: 'Yetişkinlerde 1 saatten uzun etkinliklerde gerekebilir (TÜBER); günlük içecek değildir. Çocuk ve ergenlerde sık ya da fazla tüketim fazla kilo riskini artırabilir (AAP); ihtiyacı antrenör, hekim ya da diyetisyenle konuşun.' }),
  F('meyve-suyu', 'Taze meyve suyu (az miktarda)', 'sivi', 'meyve-suyu', { cost: 2, note: 'Şeker içerir; su yerine değil, ölçülü.' }),
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export interface AltOptions {
  avoid: Allergen[];
  vegetarian: boolean;
  vegan: boolean;
  cheap: boolean;
  /** ulaşamıyorum / sevmiyorum */
  exclude: string[];
  forPre: boolean;
  forPost: boolean;
  /** 18 yaş altı: yalnızca yetişkine uygun ürünler (ör. spor içeceği) önerilmez */
  minor?: boolean;
}

export function alternativesFor(food: Food, o: AltOptions): { food: Food; reason: string; score: number }[] {
  const out: { food: Food; reason: string; score: number }[] = [];
  for (const f of FOODS) {
    if (f.id === food.id || o.exclude.includes(f.id)) continue;
    if (f.allergens.some((a) => o.avoid.includes(a)) || f.mayContain.some((a) => o.avoid.includes(a))) continue;
    if (o.minor && f.adultOnly) continue;
    if (o.vegan && !f.vegan) continue;
    if (o.vegetarian && !f.vegetarian) continue;
    if (o.cheap && f.cost === 3) continue;
    if (o.forPre && !f.pre) continue;
    if (o.forPost && !f.post) continue;
    let score = 0;
    let reason = '';
    if (f.role === food.role) {
      score += 4;
      reason = `Aynı işlevi görür: ${ROLE_NAME[f.role].toLowerCase()}.`;
    } else if ((food.role === 'sut' && f.role === 'protein') || (food.role === 'protein' && f.role === 'sut')) {
      score += 2;
      reason = 'Protein ve kalsiyum açısından benzer katkı sağlar.';
    } else continue;
    if (f.sub === food.sub) {
      score += 3;
      reason = `Çok benzer: ${f.sub.replace('-', ' ')} grubunda.`;
    }
    if (f.cost <= food.cost) score += 1;
    if (f.pre === food.pre) score += 0.5;
    out.push({ food: f, reason, score });
  }
  return out.sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, 'tr'));
}

// ── Pratik öğünler ──────────────────────────────────────

export type MealWhen = 'kahvalti' | 'once-3sa' | 'once-hafif' | 'sonra' | 'gunluk' | 'mac-sonrasi-gece';

export const WHEN_NAME: Record<MealWhen, string> = {
  kahvalti: 'Kahvaltı',
  'once-3sa': 'Antrenmandan 3–4 saat önce',
  'once-hafif': 'Antrenmandan 30–60 dk önce (hafif)',
  sonra: 'Antrenmandan sonra (ilk 1–2 saat)',
  gunluk: 'Ana öğün (gün içi)',
  'mac-sonrasi-gece': 'Akşam toparlanma',
};

export interface Meal {
  id: string;
  name: string;
  when: MealWhen[];
  parts: string[];
  /** içerdiği besin kimlikleri (alerjen/vejetaryen hesabı) */
  foods: string[];
  prep: string;
  why: string;
}

export const MEALS: Meal[] = [
  { id: 'yulaf-muz', name: 'Yulaf lapası, muz ve ceviz', when: ['kahvalti', 'once-3sa'], parts: ['Yulaf', 'Süt ya da su', 'Muz', 'Ceviz'], foods: ['yulaf', 'sut', 'muz', 'ceviz'], prep: '10 dk', why: 'Lifli karbonhidrat ve küçük bir yağ-protein dengesi; uzun süre enerji verir.' },
  { id: 'omlet', name: 'Peynirli omlet, tam buğday ekmeği ve domates', when: ['kahvalti', 'sonra'], parts: ['Yumurta', 'Beyaz peynir', 'Tam buğday ekmeği', 'Domates'], foods: ['yumurta', 'beyaz-peynir', 'tam-bugday-ekmek', 'domates'], prep: '10 dk', why: 'Protein ve karbonhidrat birlikte; kahvaltı ve toparlanma için dengeli.' },
  { id: 'mercimek-pilav', name: 'Mercimek çorbası, pilav ve yoğurt', when: ['gunluk', 'once-3sa', 'sonra'], parts: ['Mercimek çorbası', 'Pirinç pilavı', 'Yoğurt', 'Salata'], foods: ['mercimek', 'pirinc', 'yogurt', 'yesillik'], prep: '30 dk', why: 'Ekonomik, geleneksel, protein-karbonhidrat dengesi; bitkisel protein ve yoğurt.' },
  { id: 'tavuk-lavas', name: 'Tavuklu dürüm ve ayran', when: ['once-3sa', 'sonra', 'gunluk'], parts: ['Tam buğday lavaş', 'Tavuk göğsü', 'Marul-domates', 'Ayran'], foods: ['lavas', 'tavuk', 'yesillik', 'domates', 'ayran'], prep: '15 dk', why: 'Pratik; protein ve karbonhidrat; antrenman çantasına uygun.' },
  { id: 'makarna-tavuk', name: 'Makarna, tavuk ve salata', when: ['once-3sa', 'mac-sonrasi-gece'], parts: ['Makarna', 'Tavuk ya da hindi', 'Salata', 'Zeytinyağı'], foods: ['makarna', 'tavuk', 'yesillik', 'zeytinyagi'], prep: '25 dk', why: 'Maç/antrenman öncesi klasik: karbonhidrat ağırlıklı ve hafif protein.' },
  { id: 'kuru-fasulye-pilav', name: 'Kuru fasulye, pilav ve cacık', when: ['gunluk', 'mac-sonrasi-gece'], parts: ['Kuru fasulye', 'Pirinç pilavı', 'Cacık', 'Turşu/salata'], foods: ['kuru-fasulye', 'pirinc', 'yogurt', 'yesillik'], prep: '45 dk', why: 'Protein, karbonhidrat ve lif; akşam toparlanma öğünü.' },
  { id: 'yogurt-meyve', name: 'Yoğurt, meyve ve bal', when: ['once-hafif', 'sonra'], parts: ['Yoğurt', 'Muz ya da meyve', 'Bir kaşık bal'], foods: ['yogurt', 'muz'], prep: '3 dk', why: 'Hafif ve sindirimi kolay; protein ve hızlı enerji.' },
  { id: 'muz-fistik', name: 'Muz ve fıstık ezmeli ekmek', when: ['once-hafif', 'sonra'], parts: ['Tam buğday ekmeği', 'Fıstık ezmesi', 'Muz'], foods: ['tam-bugday-ekmek', 'fistik-ezmesi', 'muz'], prep: '3 dk', why: 'Pratik; karbonhidrat ve yağ-protein; antrenmandan önce ya da sonra.' },
  { id: 'ayran-simit', name: 'Simit, peynir ve ayran', when: ['once-hafif', 'sonra', 'gunluk'], parts: ['Simit', 'Beyaz peynir', 'Ayran'], foods: ['simit', 'beyaz-peynir', 'ayran'], prep: '2 dk', why: 'Okul/yol için pratik; sıvı ve tuz.' },
  { id: 'hurma-ceviz', name: 'Hurma ve ceviz', when: ['once-hafif'], parts: ['2–3 hurma', 'Birkaç ceviz'], foods: ['hurma', 'ceviz'], prep: '1 dk', why: 'Küçük porsiyonda hızlı enerji; mideyi yormaz.' },
  { id: 'nohut-salata', name: 'Nohutlu bulgur salatası', when: ['gunluk', 'once-3sa'], parts: ['Bulgur', 'Nohut', 'Domates-salatalık', 'Zeytinyağı-limon'], foods: ['bulgur', 'nohut', 'domates', 'zeytinyagi'], prep: '20 dk', why: 'Vejetaryen; protein, karbonhidrat ve lif birlikte.' },
  { id: 'sut-kayisi', name: 'Süt ya da kefir ile kuru kayısı', when: ['sonra', 'once-hafif'], parts: ['Bir bardak süt ya da kefir', 'Kuru kayısı'], foods: ['sut', 'kuru-kayisi'], prep: '1 dk', why: 'Toparlanma: sıvı, protein ve karbonhidrat.' },
  { id: 'balik-patates', name: 'Fırında balık, patates ve salata', when: ['mac-sonrasi-gece', 'gunluk'], parts: ['Balık', 'Fırın patates', 'Salata', 'Zeytinyağı'], foods: ['balik', 'patates', 'yesillik', 'zeytinyagi'], prep: '35 dk', why: 'Protein, yararlı yağlar ve karbonhidrat; akşam öğünü.' },
  { id: 'tofu-pirinc', name: 'Tofulu sebze ve pirinç', when: ['gunluk', 'sonra'], parts: ['Tofu', 'Sebzeler', 'Pirinç'], foods: ['tofu', 'brokoli', 'pirinc'], prep: '20 dk', why: 'Vegan seçenek: bitkisel protein ve karbonhidrat.' },
  { id: 'lor-meyve', name: 'Lor, meyve ve yulaf', when: ['kahvalti', 'sonra'], parts: ['Lor', 'Meyve', 'Yulaf'], foods: ['lor', 'cilek', 'yulaf'], prep: '5 dk', why: 'Yüksek protein, hafif; kahvaltı ya da ara öğün.' },
  { id: 'humus-lavas', name: 'Humuslu sebze lavaşı', when: ['gunluk', 'once-3sa'], parts: ['Lavaş', 'Humus', 'Havuç, salatalık, marul'], foods: ['lavas', 'humus', 'havuc', 'domates', 'yesillik'], prep: '10 dk', why: 'Vejetaryen/vegan; protein, karbonhidrat ve sebze.' },
  { id: 'menemen', name: 'Menemen ve tam buğday ekmeği', when: ['kahvalti', 'sonra'], parts: ['Yumurta', 'Domates, biber', 'Tam buğday ekmeği'], foods: ['yumurta', 'domates', 'tam-bugday-ekmek'], prep: '10 dk', why: 'Protein ve karbonhidrat bir arada; sabah ya da antrenman sonrası için tanıdık bir seçenek.' },
  { id: 'serpme-kahvalti', name: 'Kahvaltı tabağı: yumurta, peynir, zeytin, domates, ekmek', when: ['kahvalti'], parts: ['Haşlanmış yumurta', 'Beyaz peynir', 'Zeytin', 'Domates-salatalık', 'Tam buğday ekmeği'], foods: ['yumurta', 'beyaz-peynir', 'zeytin', 'domates', 'tam-bugday-ekmek'], prep: '5 dk', why: 'Geleneksel kahvaltı; protein, süt grubu, sebze ve tahılı bir araya getirir. Peynir ve zeytin tuzlu olabilir, ölçülü tüketin.' },
  { id: 'sut-muz', name: 'Süt ve muz', when: ['once-hafif', 'sonra'], parts: ['Bir bardak süt', 'Muz'], foods: ['sut', 'muz'], prep: '1 dk', why: 'Sıvı, protein ve hızlı enerji; çantada taşınması kolay bir toparlanma atıştırmalığı.' },
  { id: 'tavuk-pilav', name: 'Tavuklu pilav, cacık ve salata', when: ['gunluk', 'once-3sa', 'sonra', 'mac-sonrasi-gece'], parts: ['Pirinç pilavı', 'Tavuk', 'Cacık', 'Domates-salatalık'], foods: ['pirinc', 'tavuk', 'yogurt', 'domates'], prep: '25 dk', why: 'Sindirimi kolay karbonhidrat ve yağı az protein; maç öncesi de sonrası da uygun.' },
  { id: 'izgara-et-bulgur', name: 'Izgara dana, bulgur pilavı ve salata', when: ['gunluk', 'mac-sonrasi-gece'], parts: ['Izgara ya da fırında az yağlı dana', 'Bulgur pilavı', 'Yeşil salata'], foods: ['dana', 'bulgur', 'yesillik', 'domates'], prep: '30 dk', why: 'Protein, demir ve lif; yoğun antrenmandan sonra doyurucu bir ana öğün.' },
  { id: 'nohutlu-pilav', name: 'Nohutlu pilav ve yoğurt', when: ['gunluk', 'once-3sa'], parts: ['Pirinç pilavı', 'Nohut', 'Yoğurt'], foods: ['pirinc', 'nohut', 'yogurt'], prep: '25 dk', why: 'Karbonhidrat ve bitkisel protein bir arada; ekonomik ve vejetaryen.' },
  { id: 'mercimekli-kofte', name: 'Mercimekli köfte ve yeşillik', when: ['gunluk', 'once-hafif'], parts: ['Mercimekli köfte', 'Marul, maydanoz', 'Zeytinyağı, limon'], foods: ['mercimek', 'bulgur', 'yesillik', 'zeytinyagi'], prep: '30 dk', why: 'Vegan seçenek: bitkisel protein, lif ve demir; bulgur nedeniyle gluten içerir.' },
  { id: 'tahin-pekmez', name: 'Tahin-pekmezli ekmek', when: ['once-hafif', 'sonra'], parts: ['Tam buğday ekmeği', 'Tahin', 'Pekmez'], foods: ['tam-bugday-ekmek', 'tahin', 'pekmez'], prep: '2 dk', why: 'Geleneksel ve hızlı enerji kaynağı; vegan. Küçük porsiyon yeterlidir.' },
  { id: 'tavuk-patates', name: 'Fırında tavuk, patates ve sebze', when: ['gunluk', 'mac-sonrasi-gece'], parts: ['Fırında tavuk', 'Fırın patates', 'Brokoli ya da mevsim sebzesi', 'Zeytinyağı'], foods: ['tavuk', 'patates', 'brokoli', 'zeytinyagi'], prep: '40 dk', why: 'Sade tarifle gluten içermeyen, dengeli akşam yemeği; tek tepside pişer.' },
  { id: 'peynirli-tost', name: 'Peynirli tost ve domates', when: ['once-hafif', 'sonra', 'gunluk'], parts: ['Tam buğday ekmeği', 'Beyaz peynir', 'Domates'], foods: ['tam-bugday-ekmek', 'beyaz-peynir', 'domates'], prep: '5 dk', why: 'Okul çıkışı ya da antrenman sonrası için pratik; karbonhidrat ve süt grubu protein.' },
  { id: 'yulaf-yogurt', name: 'Yoğurtlu yulaf, muz ve bal', when: ['kahvalti', 'once-3sa'], parts: ['Yulaf', 'Yoğurt', 'Muz', 'Bir kaşık bal'], foods: ['yulaf', 'yogurt', 'muz', 'bal'], prep: '5 dk', why: 'Uzun süre doyuran lifli karbonhidrat ve protein; sabah ya da antrenmana birkaç saat kala.' },
  { id: 'balik-bulgur', name: 'Fırında balık, bulgur ve salata', when: ['gunluk', 'mac-sonrasi-gece'], parts: ['Fırında balık', 'Bulgur pilavı', 'Salata', 'Zeytinyağı'], foods: ['balik', 'bulgur', 'yesillik', 'zeytinyagi'], prep: '30 dk', why: 'Protein ve yararlı yağlar; akşam ana öğünü.' },
  { id: 'yumurta-simit', name: 'Haşlanmış yumurta, simit ve ayran', when: ['kahvalti', 'once-hafif', 'sonra'], parts: ['Haşlanmış yumurta', 'Simit', 'Ayran'], foods: ['yumurta', 'simit', 'ayran'], prep: '10 dk', why: 'Sokakta ya da okul yolunda bulunabilen, dengeli ve ekonomik bir kombinasyon.' },
  { id: 'meyve-peynir', name: 'Meyve ve birkaç dilim peynir', when: ['once-hafif', 'sonra', 'gunluk'], parts: ['Elma ya da mandalina', 'Birkaç dilim beyaz peynir'], foods: ['elma', 'beyaz-peynir'], prep: '2 dk', why: 'Okul çantası için kolay ara öğün; lif, vitamin ve süt grubu.' },
  { id: 'domates-makarna', name: 'Domates soslu makarna ve yeşil salata', when: ['once-3sa', 'gunluk'], parts: ['Makarna', 'Domates sosu', 'Yeşil salata', 'Zeytinyağı'], foods: ['makarna', 'domates', 'yesillik', 'zeytinyagi'], prep: '20 dk', why: 'Maç öncesi klasik karbonhidrat öğünü; yağı ve lifi az tutulabilir, vegan.' },
];

export function mealAllergens(m: Meal): Allergen[] {
  const set = new Set<Allergen>();
  for (const id of m.foods) for (const a of FOOD_BY_ID[id]?.allergens ?? []) set.add(a);
  return [...set];
}
export const mealVegetarian = (m: Meal) => m.foods.every((id) => FOOD_BY_ID[id]?.vegetarian);
export const mealVegan = (m: Meal) => m.foods.every((id) => FOOD_BY_ID[id]?.vegan);
export const MEAL_BY_ID: Record<string, Meal> = Object.fromEntries(MEALS.map((m) => [m.id, m]));

// ── Rehber metinleri ────────────────────────────────────

export const PRINCIPLES: { t: string; d: string }[] = [
  { t: 'Dengeli tabak', d: 'Her öğünde enerji için karbonhidrat (pilav, bulgur, ekmek, makarna, patates), onarım için protein (et, tavuk, balık, yumurta, baklagil, süt ürünleri) ve sebze-meyve bulundurun.' },
  { t: 'Düzenli öğün', d: 'Üç ana öğün ve gerektiğinde ara öğün. Öğün atlamak antrenmanda enerji düşmesine yol açabilir.' },
  { t: 'Önce gerçek yiyecek', d: 'Spor performansı için temel, dengeli ve çeşitli beslenmedir. Toz, takviye ve enerji içeceklerinden önce sofranızı düzenleyin.' },
  { t: 'Sıvı', d: 'Gün boyu düzenli su için. İdrar renginin açık sarı olması iyi bir ipucudur. Elektrolitli içecek, yetişkin sporcularda uzun ya da sıcak havadaki etkinliklerde gerekebilir; çocuk ve ergenlerde karar antrenör, hekim ya da diyetisyene aittir.' },
  { t: 'Uyku ve toparlanma', d: 'Beslenme kadar uyku da kas onarımı ve gelişim için önemlidir. Ergenler için genel öneri günde yaklaşık 8–10 saat uykudur.' },
];

export const TIMELINE: { t: string; items: string[] }[] = [
  { t: 'Antrenmandan 3–4 saat önce', items: ['Karbonhidratın ağırlıkta olduğu ana öğün (makarna, pilav, bulgur, ekmek, patates); alışık olduğun, sevdiğin yiyeceklerden (TÜBER).', 'Orta miktarda protein; yağ ve lif az olsun (mideyi yorar).', 'Yeterli su için.'] },
  { t: 'Antrenmandan 30–60 dk önce', items: ['Hafif ve sindirimi kolay atıştırmalık: muz, ekmek-bal, yoğurt, hurma.', 'Mideniz hassassa sadece küçük bir porsiyon ya da sıvı yeterli olabilir.'] },
  { t: 'Antrenman sırasında', items: ['Çoğu antrenmanda su yeterlidir; küçük yudumlarla düzenli için.', 'Yetişkin sporcularda 1 saatten uzun ya da sıcak ve nemli havadaki etkinliklerde karbonhidrat ve elektrolit içeren içecek gerekebilir (TÜBER). Çocuk ve ergenlerde bunu antrenör, hekim ya da diyetisyenle konuş; spor içeceği günlük içecek değildir.'] },
  { t: 'Antrenmandan sonra (ilk 1–2 saat)', items: ['Karbonhidrat + protein birlikte: ayran-simit, yoğurt-meyve, tavuklu dürüm, süt-muz.', 'Sıvı kaybını yerine koyun; sonra ana öğününüzü yiyin.'] },
];

export const YOUTH_RULES: string[] = [
  'Çocuk ve ergenler büyüme ve gelişme çağındadır; enerji ihtiyacı yüksektir. Aşırı kalori kısıtlaması, katı kilo verme programları ve öğün atlama önerilmez.',
  'Kilo ya da vücut görünümüyle ilgili kaygınız varsa bu içeriğe değil bir hekime ya da diyetisyene danışın.',
  'Protein tozu, kreatin, yağ yakıcı ya da enerji içeceği gibi takviyeler çocuk ve ergen sporcular için önerilmez; önce dengeli beslenmeye odaklanın.',
  'Alerji, kronik hastalık ya da özel bir diyet söz konusuysa kişiye özel plan için bir hekim ve diyetisyen gereklidir.',
];
