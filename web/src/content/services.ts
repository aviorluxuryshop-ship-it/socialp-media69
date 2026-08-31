import type { Locale } from './site';

export type ServiceBlock = { title: string; desc: string };

export type ServiceDetail = {
  slug: string;
  no: string;
  title: string;
  intro: string;
  hero: string;
  /** Feature grid — what the service actually covers. */
  blocks: ServiceBlock[];
  /** Optional numbered working process. */
  process?: { title: string; steps: ServiceBlock[] };
  /** Optional "who is this for" list, rendered with sector imagery. */
  audience?: { title: string; items: { label: string; image: string }[] };
  gallery: string[];
};

/**
 * The three detail pages mirror the service pages that exist on socialpmedia.com.
 * All descriptive copy is the agency's own, taken from those pages.
 */
const trServices: ServiceDetail[] = [
  {
    slug: 'sosyal-medya-yonetimi',
    no: '04',
    title: 'Sosyal Medya Yönetimi',
    intro:
      'Markanızın dijital dünyadaki kimliğini profesyonel bir şekilde yönetiyoruz. Hedef kitlenize uygun içerik stratejileri oluşturuyor, özgün fotoğraf ve video çekimleri gerçekleştiriyor, yaratıcı tasarımlar hazırlıyor ve düzenli içerik planlaması yapıyoruz. Hesap yönetimi, topluluk etkileşimi ve performans analizleriyle sosyal medya hesaplarınızı yalnızca aktif tutmakla kalmıyor, markanızın sürdürülebilir şekilde büyümesini sağlıyoruz.',
    hero: 'ekip-salon',
    blocks: [
      {
        title: 'İçerik Stratejisi',
        desc: 'Her markanın hedef kitlesi ve iletişim dili farklıdır. Markanıza özel bir içerik stratejisi kurgulayarak paylaşımlarınızı rastgele değil, planlı hale getiriyoruz.',
      },
      {
        title: 'Çekim & Prodüksiyon',
        desc: 'Özgün fotoğraf ve video çekimlerini kendi ekibimizle gerçekleştiriyoruz. Dışarıdan içerik tedarik etmenize gerek kalmıyor.',
      },
      {
        title: 'Tasarım & Kurgu',
        desc: 'Post ve story tasarımları, kurgu ve renk çalışmalarıyla markanıza tutarlı bir görsel dil kazandırıyoruz.',
      },
      {
        title: 'Hesap Yönetimi',
        desc: 'Paylaşım takvimi, topluluk etkileşimi ve mesaj yönetimiyle hesabınızı düzenli ve canlı tutuyoruz.',
      },
      {
        title: 'Performans Analizi',
        desc: 'Erişim, etkileşim ve büyüme verilerini takip ediyor, stratejiyi elde ettiğimiz sonuçlara göre güncelliyoruz.',
      },
      {
        title: 'Marka İletişimi',
        desc: 'Markanızın sesini tek bir dil üzerinden kuruyor, tüm kanallarda tutarlı bir iletişim sağlıyoruz.',
      },
    ],
    gallery: ['nail-dergi', 'guzellik-merkezi', 'cekim-kamera', 'gazete-siyahbeyaz', 'icerik-hazir', 'cekim-studyo'],
  },
  {
    slug: 'web-tasarim-kurulum',
    no: '07',
    title: 'Web Tasarımı & Kurulum',
    intro:
      'İşletmenizi en iyi şekilde yansıtan, modern ve kullanıcı odaklı web siteleri tasarlıyoruz. Mobil uyumlu, hızlı açılan ve SEO altyapısına sahip web siteleri geliştirerek ziyaretçilerinizin güvenini kazanmanıza yardımcı oluyoruz. Kurumsal web siteleri, hizmet sayfaları, iletişim formları ve ihtiyaçlarınıza özel çözümlerle markanızı dijital dünyada profesyonel bir şekilde temsil ediyoruz.',
    hero: 'bilboard-mockup',
    blocks: [
      {
        title: 'Modern Tasarım',
        desc: 'Markanızın kimliğine uygun, estetik ve profesyonel tasarımlar hazırlıyoruz. Kullanıcı deneyimini ön planda tutarak güven veren ve dikkat çeken web siteleri oluşturuyoruz.',
      },
      {
        title: 'Mobil Uyumlu Yapı',
        desc: 'Hazırladığımız tüm web siteleri telefon, tablet ve bilgisayarlarda kusursuz şekilde çalışır. Her ekranda hızlı, akıcı ve kullanıcı dostu bir deneyim sunar.',
      },
      {
        title: 'SEO Altyapısı',
        desc: 'Arama motorlarına uygun altyapı sayesinde web sitenizin görünürlüğünü artırıyor, potansiyel müşterilerinizin sizi daha kolay bulmasını sağlıyoruz.',
      },
      {
        title: 'Hızlı ve Güvenli',
        desc: 'Yüksek performanslı altyapı ve güvenlik odaklı geliştirme süreçleriyle ziyaretçilerinize kesintisiz, hızlı ve güvenilir bir web deneyimi sunuyoruz.',
      },
    ],
    process: {
      title: 'Çalışma Sürecimiz',
      steps: [
        {
          title: 'Analiz & Strateji',
          desc: 'Çalışmaya başlamadan önce markanızı, sektörünüzü ve hedef kitlenizi detaylı şekilde analiz ediyoruz. İhtiyaçlarınızı dinleyerek web sitenizin amacı, yapısı ve kullanıcı deneyimi üzerine stratejik bir plan oluşturuyoruz.',
        },
        {
          title: 'Tasarım',
          desc: 'Markanızın kurumsal kimliğini yansıtan, modern ve kullanıcı dostu tasarımlar hazırlıyoruz. Hem estetik hem de işlevselliği ön planda tutarak ziyaretçilerinizin kolayca gezinebileceği bir arayüz tasarlıyoruz.',
        },
        {
          title: 'Geliştirme',
          desc: 'Onaylanan tasarımı profesyonel bir altyapıyla geliştiriyoruz. Mobil uyumluluk, yüksek performans, güvenlik ve SEO standartlarını dikkate alarak web sitenizi tüm cihazlarda sorunsuz çalışacak şekilde hazırlıyoruz.',
        },
        {
          title: 'Test & Yayın',
          desc: 'Web siteniz yayına alınmadan önce tüm sayfaları, bağlantıları, formları ve performans testlerini titizlikle gerçekleştiriyoruz. Son kontroller tamamlandıktan sonra sitenizi sorunsuz bir şekilde yayına alıyoruz.',
        },
        {
          title: 'Destek',
          desc: 'Web siteniz yayına alındıktan sonra da yanınızda olmaya devam ediyoruz. Gerekli güncellemeler, teknik destek ve geliştirme ihtiyaçlarınız için hızlı çözümler sunarak web sitenizin her zaman güncel ve verimli çalışmasını sağlıyoruz.',
        },
      ],
    },
    audience: {
      title: 'Web Sitesi Kimler İçin?',
      items: [
        { label: 'Güzellik Merkezleri', image: 'sektor-guzellik' },
        { label: 'Restoran & Kafeler', image: 'sektor-restoran' },
        { label: 'Eğitim Kurumları', image: 'sektor-egitim' },
        { label: 'E-Ticaret Markaları', image: 'sektor-portre' },
        { label: 'İnşaat Firmaları', image: 'sektor-insaat' },
        { label: 'Kurumsal Firmalar', image: 'sektor-kurumsal' },
      ],
    },
    gallery: [],
  },
  {
    slug: 'meta-google-reklamlari',
    no: '06',
    title: 'Meta & Google Reklamları',
    intro:
      'Performans odaklı reklam yönetimiyle markanızı doğru kitleyle buluşturuyoruz. Kampanyalarınızı kuruyor, sürekli optimize ediyor ve sonuçları şeffaf raporlarla paylaşıyoruz.',
    hero: 'meta-tepsi',
    blocks: [
      {
        title: 'Hedef Kitle Analizi',
        desc: 'Markanız için en doğru hedef kitleyi belirliyor, yaş, ilgi alanı, konum ve davranış analizleriyle reklamlarınızı potansiyel müşterilerinize ulaştırıyoruz.',
      },
      {
        title: 'Reklam Stratejisi',
        desc: 'İşletmenizin hedeflerine uygun kampanyalar oluşturuyor, marka bilinirliği, etkileşim, web sitesi trafiği veya satış odaklı reklam planları hazırlıyoruz.',
      },
      {
        title: 'Sürekli Optimizasyon',
        desc: 'Yayınlanan reklamları düzenli olarak analiz ediyor, performansı artırmak için hedefleme, kreatif ve bütçe optimizasyonları gerçekleştiriyoruz.',
      },
      {
        title: 'Performans Raporlama',
        desc: 'Reklam sonuçlarını detaylı raporlarla takip ediyor, erişim, tıklama, dönüşüm ve yatırım getirisi gibi tüm verileri şeffaf bir şekilde sizinle paylaşıyoruz.',
      },
    ],
    gallery: ['instagram-tepsi', 'telefon-tepsi', 'bilboard-mockup'],
  },
];

const enServices: ServiceDetail[] = [
  {
    slug: 'social-media-management',
    no: '04',
    title: 'Social Media Management',
    intro:
      'We professionally manage your brand’s identity in the digital world. We build content strategies suited to your audience, produce original photo and video shoots, prepare creative designs and plan content on a steady schedule. With account management, community engagement and performance analysis, we don’t just keep your accounts active — we help your brand grow sustainably.',
    hero: 'ekip-salon',
    blocks: [
      {
        title: 'Content Strategy',
        desc: 'Every brand has a different audience and a different voice. We build a content strategy specific to your brand so posting becomes planned rather than random.',
      },
      {
        title: 'Shoot & Production',
        desc: 'We handle original photo and video shoots with our own crew, so you never have to source content elsewhere.',
      },
      {
        title: 'Design & Editing',
        desc: 'Post and story design, editing and colour work give your brand a consistent visual language.',
      },
      {
        title: 'Account Management',
        desc: 'A publishing calendar, community engagement and message handling keep your account active and consistent.',
      },
      {
        title: 'Performance Analysis',
        desc: 'We track reach, engagement and growth, then update the strategy based on the results we see.',
      },
      {
        title: 'Brand Communication',
        desc: 'We define your brand’s voice once and keep communication consistent across every channel.',
      },
    ],
    gallery: ['nail-dergi', 'guzellik-merkezi', 'cekim-kamera', 'gazete-siyahbeyaz', 'icerik-hazir', 'cekim-studyo'],
  },
  {
    slug: 'web-design-setup',
    no: '07',
    title: 'Web Design & Setup',
    intro:
      'We design modern, user-focused websites that represent your business properly. We build mobile-friendly, fast-loading sites with SEO foundations that help you earn your visitors’ trust. Corporate sites, service pages, contact forms and tailored solutions — we represent your brand professionally in the digital world.',
    hero: 'bilboard-mockup',
    blocks: [
      {
        title: 'Modern Design',
        desc: 'We prepare aesthetic, professional designs that match your brand identity. Putting user experience first, we create sites that feel trustworthy and hold attention.',
      },
      {
        title: 'Mobile-Friendly',
        desc: 'Every site we build works flawlessly on phones, tablets and desktops, offering a fast, smooth and user-friendly experience on every screen.',
      },
      {
        title: 'SEO Foundations',
        desc: 'Search-engine-ready foundations increase your site’s visibility and make it easier for potential customers to find you.',
      },
      {
        title: 'Fast and Secure',
        desc: 'High-performance infrastructure and security-focused development give your visitors an uninterrupted, fast and reliable experience.',
      },
    ],
    process: {
      title: 'How We Work',
      steps: [
        {
          title: 'Analysis & Strategy',
          desc: 'Before we start, we analyse your brand, your sector and your audience in detail. Listening to your needs, we build a strategic plan around the site’s purpose, structure and user experience.',
        },
        {
          title: 'Design',
          desc: 'We prepare modern, user-friendly designs that reflect your corporate identity, balancing aesthetics and function so visitors can navigate easily.',
        },
        {
          title: 'Development',
          desc: 'We develop the approved design on professional foundations, accounting for mobile compatibility, high performance, security and SEO standards across all devices.',
        },
        {
          title: 'Testing & Launch',
          desc: 'Before launch we carefully test every page, link, form and performance metric. Once the final checks are done, we take your site live smoothly.',
        },
        {
          title: 'Support',
          desc: 'We stay with you after launch, providing fast solutions for updates, technical support and development needs so your site stays current and efficient.',
        },
      ],
    },
    audience: {
      title: 'Who Is a Website For?',
      items: [
        { label: 'Beauty Centres', image: 'sektor-guzellik' },
        { label: 'Restaurants & Cafes', image: 'sektor-restoran' },
        { label: 'Education Institutions', image: 'sektor-egitim' },
        { label: 'E-Commerce Brands', image: 'sektor-portre' },
        { label: 'Construction Firms', image: 'sektor-insaat' },
        { label: 'Corporate Companies', image: 'sektor-kurumsal' },
      ],
    },
    gallery: [],
  },
  {
    slug: 'meta-google-ads',
    no: '06',
    title: 'Meta & Google Ads',
    intro:
      'Performance-focused campaign management connects your brand with the right audience. We set your campaigns up, optimise them continuously and share the results in transparent reports.',
    hero: 'meta-tepsi',
    blocks: [
      {
        title: 'Audience Analysis',
        desc: 'We identify the right audience for your brand and reach potential customers through age, interest, location and behaviour analysis.',
      },
      {
        title: 'Campaign Strategy',
        desc: 'We build campaigns around your business goals — brand awareness, engagement, website traffic or sales-focused advertising plans.',
      },
      {
        title: 'Continuous Optimisation',
        desc: 'We analyse live campaigns regularly and optimise targeting, creative and budget to improve performance.',
      },
      {
        title: 'Performance Reporting',
        desc: 'We track results in detailed reports and share reach, clicks, conversions and return on investment transparently.',
      },
    ],
    gallery: ['instagram-tepsi', 'telefon-tepsi', 'bilboard-mockup'],
  },
];

export const servicesByLocale: Record<Locale, ServiceDetail[]> = {
  tr: trServices,
  en: enServices,
};

export function getService(locale: Locale, slug: string) {
  return servicesByLocale[locale].find((s) => s.slug === slug);
}
