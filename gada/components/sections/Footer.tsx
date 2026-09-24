import { site } from '@/content/site'

export default function Footer() {
  return (
    <footer className="footer layer-front">
      <div className="wrap footer__row">
        <a className="footer__brand" href="#ana-sayfa">
          GADA
        </a>
        <span>Türkiye</span>
        <a href={site.instagram.url} target="_blank" rel="noopener noreferrer">
          Instagram
        </a>
        <a href="#iletisim">İletişim</a>
        <span>© {site.year} GADA</span>
      </div>
    </footer>
  )
}
