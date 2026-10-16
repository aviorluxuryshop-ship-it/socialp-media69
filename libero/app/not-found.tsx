import Link from 'next/link';
import { Icon } from '@/components/Icon';
import { PageHead } from '@/components/PageHead';

export default function NotFound() {
  return (
    <>
      <PageHead
        eyebrow="404 · Ofsayt"
        title={
          <>
            Bu sayfa <em>sahanın dışında.</em>
          </>
        }
        lead="Aradığın adres yok ya da taşınmış olabilir. Aşağıdaki yollardan devam edebilirsin."
      />
      <section className="section section--tight">
        <div className="container">
          <ul className="rel-list" style={{ maxWidth: 560 }}>
            {[
              ['/teknikler/', 'Teknik kütüphanesi'],
              ['/program/', 'Kişisel program'],
              ['/videolar/', 'Videolar'],
              ['/taktik/test/', 'Futbol IQ testi'],
              ['/', 'Ana sayfa'],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="card rel">
                  <span className="rel__name">{label}</span>
                  <Icon name="arrow" />
                </Link>
              </li>
            ))}
          </ul>
          <p className="field__hint" style={{ marginTop: 24 }}>İpucu: herhangi bir sayfada <kbd className="kbd">Ctrl</kbd> + <kbd className="kbd">K</kbd> ile tüm içerikte arama yapabilirsin.</p>
        </div>
      </section>
    </>
  );
}
