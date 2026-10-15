export interface NavItem {
  href: string;
  title: string;
  desc: string;
  icon: string;
}
export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Öğren',
    items: [
      { href: '/teknikler/', title: 'Teknik kütüphanesi', desc: 'Pas, şut, kontrol, çalım, kafa, kalecilik ve duran toplar. Arayın, seviyenize göre çalışın.', icon: 'ball' },
      { href: '/top-kontrolu/', title: 'Top kontrolü ve topsuz hareket', desc: 'İlk temas, yönlü kontrol, boş alan, koşu zamanlaması ve pas açısı.', icon: 'target' },
      { href: '/taktik/', title: 'Taktik ve Futbol IQ', desc: 'Pres, geçişler, savunma yerleşimi ve maç durumu testleri.', icon: 'brain' },
      { href: '/pozisyonlar/', title: 'Pozisyonlar', desc: 'Kaleciden santrfora, her pozisyonun düşünme biçimi ve gelişim planı.', icon: 'flag' },
      { href: '/taktik-tahtasi/', title: 'Taktik tahtası', desc: 'Oyuncuları sürükleyin, pas ve koşu yollarını adım adım oynatın.', icon: 'board' },
    ],
  },
  {
    label: 'Gelişim',
    items: [
      { href: '/program/', title: 'Kişisel program', desc: 'Yaşa, seviyeye ve ortama göre haftalık plan; tamamla, devam et, geçmişi gör.', icon: 'calendar' },
      { href: '/fiziksel/', title: 'Fiziksel gelişim', desc: 'Sürat, çeviklik, kuvvet, denge ve kas gruplarına göre egzersizler.', icon: 'dumbbell' },
      { href: '/beslenme/', title: 'Beslenme ve toparlanma', desc: 'Antrenman öncesi-sonrası, sıvı, pratik öğünler ve yiyecek alternatifleri.', icon: 'leaf' },
    ],
  },
  {
    label: 'Analiz',
    items: [
      { href: '/analiz/performans/', title: 'Performans analizi', desc: 'Antrenman geçmişi, test sonuçları ve teknik seviye gelişimi.', icon: 'chart' },
      { href: '/analiz/video/', title: 'Video analizi', desc: 'Kendi videonuzu yükleyin; kare kare ilerleyin, çizin, not alın.', icon: 'video' },
      { href: '/analiz/oyuncular/', title: 'Oyuncu analizi', desc: 'Profesyonel oyuncuların oyun tarzı, pasları ve topsuz hareketleri.', icon: 'user' },
    ],
  },
];

export const TOP_LINKS = [{ href: '/videolar/', title: 'Videolar' }];
