import Link from 'next/link';
import { LogoMark } from './Logo';

const COLS = [
  {
    t: 'Öğren',
    l: [
      ['/teknikler/', 'Teknik kütüphanesi'],
      ['/top-kontrolu/', 'Top kontrolü ve topsuz hareket'],
      ['/taktik/', 'Taktik ve Futbol IQ'],
      ['/pozisyonlar/', 'Pozisyonlar'],
      ['/taktik-tahtasi/', 'Taktik tahtası'],
    ],
  },
  {
    t: 'Gelişim',
    l: [
      ['/program/', 'Kişisel program'],
      ['/fiziksel/', 'Fiziksel gelişim'],
      ['/beslenme/', 'Beslenme ve toparlanma'],
      ['/videolar/', 'Videolar'],
    ],
  },
  {
    t: 'Analiz',
    l: [
      ['/analiz/performans/', 'Performans analizi'],
      ['/analiz/video/', 'Video analizi'],
      ['/analiz/oyuncular/', 'Oyuncu analizi'],
      ['/profil/', 'Panelim ve verilerim'],
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="site-footer__mark">
              <LogoMark size={34} />
            </span>
            <p className="h3">
              Futbolu <em>anlayarak</em> öğrenin.
            </p>
            <p className="muted" style={{ maxWidth: '40ch', marginTop: 12 }}>
              Teknik, taktik, fiziksel hazırlık ve gelişim takibi — tek yerde, tamamen Türkçe.
            </p>
          </div>
          {COLS.map((c) => (
            <nav key={c.t} aria-label={c.t} className="site-footer__col">
              <p className="mono">{c.t}</p>
              <ul>
                {c.l.map(([h, t]) => (
                  <li key={h}>
                    <Link href={h}>{t}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="site-footer__legal">
          <p>
            <strong>Veriler bu tarayıcıda saklanır.</strong> Hesap sistemi yoktur; ilerlemeniz yalnızca bu cihazda ve bu
            tarayıcıda görünür. Profil sayfasından yedek alabilirsiniz.
          </p>
          <p>
            İçerik eğitim amaçlıdır; tıbbi tavsiye veya bireysel diyet programı yerine geçmez. Sağlık sorununuz varsa ya
            da çocuk/ergen sporcu için program uyguluyorsanız bir hekim, antrenör veya diyetisyene danışın.
          </p>
          <p className="muted">Harici videolar sahiplerine aittir; Libero bunları yalnızca resmî gömme oynatıcısıyla gösterir.</p>
        </div>
      </div>
      <span className="site-footer__giant" aria-hidden="true" lang="en">
        Libero
      </span>
    </footer>
  );
}
