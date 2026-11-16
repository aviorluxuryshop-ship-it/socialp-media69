import Link from "next/link";
import Icon from "./Icon";
import Logo from "./Logo";
import SocialLinks from "./SocialLinks";
import { getLegalDocs } from "@/content/legal";
import { categories } from "@/data/products";
import { isTestPayment, mainNav, site } from "@/data/site";
import { legalCompany, mailLink, telLink, waLink } from "@/lib/site-helpers";

const h = "text-[11.5px] font-semibold uppercase tracking-[0.2em] text-cream/55";
const a = "inline-flex min-h-[40px] items-center text-[14.5px] text-cream/85 underline-offset-4 hover:text-white hover:underline";

export default function Footer() {
  const legal = getLegalDocs(legalCompany);
  const { company, contact } = site;

  return (
    <footer className="on-dark mt-24 bg-ink text-cream">
      <div className="container-x grid grid-cols-2 gap-x-8 gap-y-10 py-14 lg:grid-cols-[1.3fr_0.8fr_0.8fr_1.1fr_1.3fr]">
        <div className="col-span-2 lg:col-span-1">
          <Logo white height={52} />
          <p className="mt-5 max-w-xs text-[14.5px] leading-relaxed text-cream/70">
            2–14 yaş için üstü altı uyumlu, rahat ve şık takımlar. Aynı ürünleri Trendyol mağazamızda da bulabilirsiniz.
          </p>
          <SocialLinks stacked className="mt-3 text-cream/90" />
        </div>

        <nav aria-label="Alışveriş">
          <h2 className={h}>Alışveriş</h2>
          <ul className="mt-3">
            <li><Link className={a} href="/urunler">Tüm Ürünler</Link></li>
            {categories.map((c) => (
              <li key={c.id}><Link className={a} href={`/urunler?kategori=${c.id}`}>{c.label}</Link></li>
            ))}
            <li><Link className={a} href="/sepet">Sepetim</Link></li>
          </ul>
        </nav>

        <nav aria-label="Prime Kids">
          <h2 className={h}>Prime Kids</h2>
          <ul className="mt-3">
            {mainNav.filter((n) => n.href !== "/" && n.href !== "/urunler").map((n) => (
              <li key={n.href}><Link className={a} href={n.href}>{n.label}</Link></li>
            ))}
            <li><Link className={a} href="/hizmetlerimiz#beden-rehberi">Beden Rehberi</Link></li>
          </ul>
        </nav>

        <nav aria-label="Yardım ve yasal" className="col-span-2 sm:col-span-1">
          <h2 className={h}>Yardım ve Yasal</h2>
          <ul className="mt-3">
            {legal.map((d) => (
              <li key={d.slug}><Link className={a} href={`/yasal/${d.slug}`}>{d.title}</Link></li>
            ))}
          </ul>
        </nav>

        <div className="col-span-2 sm:col-span-1">
          <h2 className={h}>İletişim</h2>
          <ul className="mt-3 text-[14.5px] text-cream/85">
            <li><a className={`${a} gap-2.5`} href={telLink}><Icon name="phone" size={18} /> {contact.phoneDisplay}</a></li>
            <li><a className={`${a} gap-2.5`} href={waLink()} target="_blank" rel="noopener noreferrer"><Icon name="whatsapp" size={18} /> WhatsApp: {contact.whatsappDisplay}</a></li>
            <li><a className={`${a} gap-2.5`} href={mailLink}><Icon name="mail" size={18} /> {contact.email}</a></li>
            <li className="mt-2 flex gap-2.5 leading-relaxed text-cream/70"><Icon name="clock" size={18} className="mt-0.5 shrink-0" /> {contact.hours[0].days}, {contact.hours[0].time}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x grid gap-6 py-8 text-[13px] leading-relaxed text-cream/60 lg:grid-cols-2">
          <div>
            <p className="flex items-start gap-2.5 text-cream/80">
              <Icon name="lock" size={18} className="mt-0.5 shrink-0" />
              <span>
                {isTestPayment
                  ? "Online ödeme hazırlık aşamasındadır; şu anda sitede gerçek ödeme alınmaz. Sipariş için WhatsApp’tan yazabilirsiniz."
                  : `Ödemeler, ödeme kuruluşunun güvenli sayfasında kredi veya banka kartıyla yapılır. Kart bilgileriniz ${site.name} tarafından görülmez ve saklanmaz.`}{" "}
                <Link href="/yasal/guvenli-alisveris" className="underline underline-offset-4 hover:text-white">Ayrıntılar</Link>
              </span>
            </p>
          </div>
          <address className="not-italic lg:text-right">
            <span className="text-cream/80">{company.legalName}</span>
            <br />
            {company.address}
            <br />
            MERSİS: {company.mersis} · {company.taxOffice} V.D. {company.taxNo}
          </address>
        </div>
        <div className="container-x flex flex-col justify-between gap-1 border-t border-white/10 py-5 text-[12.5px] text-cream/50 sm:flex-row">
          <span>© {new Date().getFullYear()} {site.name}. Tüm hakları saklıdır.</span>
          <span>Fiyatlara KDV dahildir.</span>
        </div>
      </div>
    </footer>
  );
}
