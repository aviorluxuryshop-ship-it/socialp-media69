export interface Source {
  id: string;
  title: string;
  org: string;
  url: string;
  topic: 'egzersiz' | 'cocuk' | 'beslenme' | 'onleme' | 'kafa';
  note: string;
}

// Yalnızca gerçekten var olan ve bağlantısı doğrulanmış/yayımlanmış kaynaklar.
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
    id: 'aap-2008',
    title: 'Strength Training by Children and Adolescents (Pediatrics 2008;121:835–840)',
    org: 'Amerikan Pediatri Akademisi (AAP)',
    url: 'https://doi.org/10.1542/peds.2007-3790',
    topic: 'cocuk',
    note: 'Nitelikli gözetimle güçlendirme güvenlidir; yarışma halteri, güç kaldırma ve maksimum denemeler fiziksel ve iskelet olgunluğuna kadar ertelenmelidir.',
  },
  {
    id: 'fa-heading',
    title: 'Güncellenmiş kafa vuruşu yönergesi (2020)',
    org: 'İngiltere Futbol Federasyonu (The FA)',
    url: 'https://www.thefa.com/news/2020/feb/24/updated-heading-guidance-announcement-240220',
    topic: 'kafa',
    note: 'İlkokul çağındaki çocuklarda (12 yaş altı) antrenmanda kafa vuruşu yapılmaz; 12–16 yaşta kademeli ve sınırlı uygulanır.',
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
    title: 'Türkiye Beslenme Rehberi (TÜBER) 2022',
    org: 'T.C. Sağlık Bakanlığı, Halk Sağlığı Genel Müdürlüğü',
    url: 'https://hsgm.saglik.gov.tr/media/attachments/2025/05/12/turkiye-beslenme-rehberi-2022.pdf',
    topic: 'beslenme',
    note: 'Türkiye’ye özgü beslenme ve fiziksel aktivite önerileri.',
  },
  {
    id: 'acsm-nutrition',
    title: 'Nutrition and Athletic Performance (ortak pozisyon bildirisi, 2016)',
    org: 'Academy of Nutrition and Dietetics, Dietitians of Canada, American College of Sports Medicine',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26917108/',
    topic: 'beslenme',
    note: 'Sporcuların kişiselleştirilmiş beslenme planı için kayıtlı diyetisyene yönlendirilmesi gerektiğini de vurgular.',
  },
  {
    id: 'uefa-nutrition',
    title: 'UEFA expert group statement on nutrition in elite football (BJSM 2021;55:416–442)',
    org: 'Collins, Maughan ve ark., British Journal of Sports Medicine',
    url: 'https://doi.org/10.1136/bjsports-2019-101961',
    topic: 'beslenme',
    note: 'Futbolda maç günü ve antrenman günü beslenmesi, “önce gıda” yaklaşımı ve genç oyunculara dair bölümler içerir.',
  },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(SOURCES.map((s) => [s.id, s]));
