import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { site } from "@/data/site";
import { mailLink, telLink, waLink } from "@/lib/site-helpers";

export const metadata: Metadata = {
  title: "İletişim",
  description: "Prime Kids iletişim bilgileri: telefon, WhatsApp, e-posta, adres ve çalışma saatleri. Beden, sipariş ve iade sorularınız için bize yazın.",
  alternates: { canonical: "/iletisim" },
};

const row = "flex min-h-[64px] items-center gap-4 px-5 py-3.5";
const ext = { target: "_blank", rel: "noopener noreferrer" } as const;

export default function ContactPage() {
  const { contact, company, social } = site;
  return (
    <>
      <PageHeader
        eyebrow="İletişim"
        title="Size nasıl yardımcı olabiliriz?"
        lead="Beden, sipariş, iade ya da toplu alım… En hızlı yanıtı WhatsApp’tan alırsınız; dilerseniz arayabilir ya da e-posta gönderebilirsiniz."
      />
      <div className="container-x grid gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div className="space-y-6">
          <ul className="card divide-y divide-line overflow-hidden">
            <li>
              <a href={waLink("Merhaba, bir sorum var.")} {...ext} className={`${row} transition-colors hover:bg-white`}>
                <Icon name="whatsapp" size={22} className="shrink-0 text-pine" />
                <span><span className="block text-[13px] text-mute">WhatsApp</span><span className="font-semibold">{contact.whatsappDisplay}</span></span>
              </a>
            </li>
            <li>
              <a href={telLink} className={`${row} transition-colors hover:bg-white`}>
                <Icon name="phone" size={22} className="shrink-0 text-pine" />
                <span><span className="block text-[13px] text-mute">Telefon</span><span className="font-semibold">{contact.phoneDisplay}</span></span>
              </a>
            </li>
            <li>
              <a href={mailLink} className={`${row} transition-colors hover:bg-white`}>
                <Icon name="mail" size={22} className="shrink-0 text-pine" />
                <span className="min-w-0"><span className="block text-[13px] text-mute">E-posta</span><span className="break-words font-semibold">{contact.email}</span></span>
              </a>
            </li>
            <li className={row}>
              <Icon name="clock" size={22} className="shrink-0 text-pine" />
              <div>
                <span className="block text-[13px] text-mute">Çalışma saatleri</span>
                <dl className="text-[14.5px]">
                  {contact.hours.map((h) => (
                    <div key={h.days} className="flex flex-wrap gap-x-2"><dt className="font-semibold">{h.days}:</dt><dd>{h.time}</dd></div>
                  ))}
                </dl>
              </div>
            </li>
            <li className={row}>
              <Icon name="pin" size={22} className="shrink-0 text-pine" />
              <address className="not-italic">
                <span className="block text-[13px] text-mute">Adres</span>
                <span className="text-[14.5px]">{company.address}</span>
              </address>
            </li>
          </ul>

          <div>
            <h2 className="eyebrow">Bizi başka nerede bulursunuz?</h2>
            <ul className="card mt-3 divide-y divide-line overflow-hidden">
              <li>
                <a href={social.instagram.url} {...ext} className={`${row} transition-colors hover:bg-white`}>
                  <Icon name="instagram" size={22} className="shrink-0" />
                  <span className="flex-1"><span className="block font-semibold">Instagram</span><span className="text-[13.5px] text-mute">@{social.instagram.handle} · yeni gelenler ve kombinler</span></span>
                  <Icon name="external" size={17} className="text-mute" />
                </a>
              </li>
              <li>
                <a href={social.trendyol.url} {...ext} className={`${row} transition-colors hover:bg-white`}>
                  <Icon name="store" size={22} className="shrink-0" />
                  <span className="flex-1"><span className="block font-semibold">Trendyol mağazamız</span><span className="text-[13.5px] text-mute">Ürünlerimizi Trendyol’da da bulabilirsiniz</span></span>
                  <Icon name="external" size={17} className="text-mute" />
                </a>
              </li>
            </ul>
          </div>

          <p className="text-[13px] leading-relaxed text-mute">
            {company.legalName} · MERSİS {company.mersis} · {company.taxOffice} V.D. {company.taxNo} · KEP: {company.kepEmail}
          </p>
        </div>

        <div id="form" className="scroll-mt-28">
          <ContactForm />
        </div>
      </div>
    </>
  );
}
