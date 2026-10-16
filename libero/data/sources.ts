export interface Source {
  id: string;
  title: string;
  org: string;
  url: string;
  topic: 'egzersiz' | 'cocuk' | 'beslenme' | 'onleme' | 'kafa';
  note: string;
}

// Yalnızca gerçekten var olan kaynaklar. Kimlikler (DOI) Crossref/Europe PMC ile, sayfa adresleri
// doğrudan istekle doğrulanmıştır. Doğrulanamayan kaynak buraya eklenmez.
export const SOURCES: Source[] = [
  {
    id: 'who-pa',
    title: 'Fiziksel aktivite (bilgi sayfası)',
    org: 'Dünya Sağlık Örgütü (WHO)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
    topic: 'cocuk',
    note: '5–17 yaş: günde ortalama en az 60 dk orta-yüksek şiddette hareket; haftada en az 3 gün kas ve kemik güçlendirici aktiviteler.',
  },
  {
    id: 'aap-2020',
    title: 'Resistance Training for Children and Adolescents (Pediatrics 2020;145(6):e20201011)',
    org: 'Amerikan Pediatri Akademisi (AAP), Stricker ve ark.',
    url: 'https://doi.org/10.1542/peds.2020-1011',
    topic: 'cocuk',
    note: 'AAP’nin güncel klinik raporu (2008 tarihli bildirinin yerini aldı). Vücut ağırlığı da direnç antrenmanı sayılır; nitelikli gözetim, teknik öncelik, haftada 2–3 ardışık olmayan gün ve yükün kademeli artışı önerilir. Yüksek şiddetli “metabolik” devre antrenmanlarının çocuklarda güvenliği belirsizdir.',
  },
  {
    id: 'nsca-2009',
    title: 'Youth Resistance Training: Updated Position Statement Paper (J Strength Cond Res 2009;23(5 Suppl):S60–S79)',
    org: 'Ulusal Kuvvet ve Kondisyon Birliği (NSCA), Faigenbaum ve ark.',
    url: 'https://www.nsca.com/globalassets/about/position-statements/position_stand_youth_resistance_training---2009.pdf',
    topic: 'cocuk',
    note: 'Nitelikli gözetim, uygun ekipman ve güvenli ortam yoksa gençler direnç egzersizi yapmamalıdır; ev ekipmanı çocuklarda özel bir yaralanma riskidir. Isınma, teknik öncelik ve hafif yükle 6–15 tekrar önerilir.',
  },
  {
    id: 'bjsm-2014',
    title: 'Position statement on youth resistance training: the 2014 International Consensus (Br J Sports Med 2014;48:498–505)',
    org: 'Lloyd ve ark.; uluslararası uzlaşı metni',
    url: 'https://doi.org/10.1136/bjsports-2013-092952',
    topic: 'cocuk',
    note: 'Önce teknik, sonra yük; nitelikli profesyonel gözetimi; ağır yüklere ancak kanıtlanmış teknik yeterlilikle geçilmesi; yorgunlukta teknik bozulmasının sakatlık riskini artırması.',
  },
  {
    id: 'fa-heading',
    title: 'Futbolda kafa vuruşu: antrenman yönergesi (güncel sayfa)',
    org: 'İngiltere Futbol Federasyonu (The FA / England Football)',
    url: 'https://www.englandfootball.com/participate/learn/brain-health/heading-in-football',
    topic: 'kafa',
    note: 'U7–U11 (11 yaş ve altı): antrenmanda kafa vuruşu tanıtılmaz. U12–U13: gerekirse haftada en fazla 1 oturum, hafif top, en fazla 5 kafa vuruşu, rakipsiz. U14–U16: haftada 1 oturum, oturum başına en fazla 10. Yaş grupları sezon başı yaşa göredir; yönerge İngiltere içindir, TFF’nin ayrı bir yönergesi doğrulanmadı.',
  },
  {
    id: 'fa-heading-2020',
    title: 'Updated heading guidance announced for youth training sessions (24 Şubat 2020)',
    org: 'İngiltere Futbol Federasyonu (The FA)',
    url: 'https://www.thefa.com/news/2020/feb/24/updated-heading-guidance-announcement-240220',
    topic: 'kafa',
    note: 'Yönergenin ilk duyurusu: temel (ilkokul) evrede antrenmanda kafa vuruşu yok; 12–16 yaşta kademeli yaklaşım.',
  },
  {
    id: 'fifa11-kids',
    title: 'A Multinational Cluster Randomised Controlled Trial to Assess the Efficacy of “11+ Kids” (Sports Med 2018;48:1493–1504)',
    org: 'Rössler, Junge ve ark.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5948238/',
    topic: 'onleme',
    note: 'Çocuklar (U9–U13) için FIFA 11+ Kids ısınma programının sakatlıkları azalttığını gösteren kümeli randomize çalışma. Program metni FIFA’ya aittir; Libero egzersizleri kendi sözcükleriyle anlatır.',
  },
  {
    id: 'fifa11',
    title: '“FIFA 11+”: yaralanmaları önlemeye yönelik ısınma programı (anlatım derlemesi)',
    org: 'Bizzini & Dvorak, British Journal of Sports Medicine 2015',
    url: 'https://bjsm.bmj.com/content/49/9/577',
    topic: 'onleme',
    note: 'FIFA Tıbbi Değerlendirme ve Araştırma Merkezi’nin (F-MARC) geliştirdiği ısınma programı ve yaralanma önleme etkilerine dair derleme.',
  },
  {
    id: 'who-diet',
    title: 'Sağlıklı beslenme (bilgi sayfası)',
    org: 'Dünya Sağlık Örgütü (WHO)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
    topic: 'beslenme',
    note: 'Dengeli beslenmenin temel ilkeleri.',
  },
  {
    id: 'tuber',
    title: 'Türkiye Beslenme Rehberi (TÜBER) 2015, 2. baskı (2019)',
    org: 'T.C. Sağlık Bakanlığı, Halk Sağlığı Genel Müdürlüğü (üniversite sunucusundaki kopya)',
    url: 'https://krtknadmn.karatekin.edu.tr/files/sbf/Turkiye_Beslenme_Rehberi_TUBER_18_04_2019.pdf',
    topic: 'beslenme',
    note: 'Türkiye’ye özgü beslenme ve fiziksel aktivite önerileri (sporcu beslenmesi bölümü dâhil). Daha yeni 2022 baskısının resmî bağlantısına bu sürümü hazırlarken erişilemedi; bu nedenle doğrulanabilen 2015 baskısı listelenmiştir.',
  },
  {
    id: 'acsm-nutrition',
    title: 'Nutrition and Athletic Performance (ortak pozisyon bildirisi, 2016)',
    org: 'Academy of Nutrition and Dietetics, Dietitians of Canada, American College of Sports Medicine',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26917108/',
    topic: 'beslenme',
    note: 'Sporcu beslenmesi ve toparlanma için kanıta dayalı genel ilkeler: yük durumuna göre karbonhidrat, protein, sıvı ve öğün zamanlaması. Kişiye özel plan için uzman değerlendirmesi gerekir.',
  },
  {
    id: 'uefa-nutrition',
    title: 'UEFA expert group statement on nutrition in elite football (Br J Sports Med 2021;55(8):416)',
    org: 'Collins, Maughan ve ark., British Journal of Sports Medicine',
    url: 'https://doi.org/10.1136/bjsports-2019-101961',
    topic: 'beslenme',
    note: 'Futbolda maç günü ve antrenman günü beslenmesi, “önce gıda” yaklaşımı ve genç oyunculara dair bölümler içerir.',
  },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
