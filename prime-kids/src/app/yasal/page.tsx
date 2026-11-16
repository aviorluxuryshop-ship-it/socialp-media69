import type { Metadata } from "next";
import Link from "next/link";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { getLegalDocs } from "@/content/legal";
import { legalCompany } from "@/lib/site-helpers";

export const metadata: Metadata = {
  title: "Yasal Bilgiler ve Sözleşmeler",
  description: "Prime Kids mesafeli satış sözleşmesi, ön bilgilendirme formu, iade ve değişim, teslimat, KVKK, gizlilik ve çerez metinleri.",
  alternates: { canonical: "/yasal" },
};

export default function LegalIndexPage() {
  const docs = getLegalDocs(legalCompany);
  return (
    <>
      <PageHeader
        eyebrow="Yardım ve yasal"
        title="Sözleşmeler ve koşullar"
        lead="Sipariş vermeden önce bilmek isteyebileceğiniz her şey: teslimat, iade, ödeme güvenliği ve kişisel verilerinizin nasıl korunduğu."
      />
      <div className="container-x">
        <ul className="grid gap-3 sm:grid-cols-2">
          {docs.map((d) => (
            <li key={d.slug}>
              <Link href={`/yasal/${d.slug}`} className="card group flex h-full items-start justify-between gap-4 p-5 transition-colors hover:border-ink sm:p-6">
                <div>
                  <h2 className="text-[17px] font-semibold">{d.title}</h2>
                  <p className="mt-1.5 text-[14.5px] leading-relaxed text-mute">{d.summary}</p>
                </div>
                <Icon name="arrow" size={18} className="mt-1 shrink-0 text-mute transition-transform duration-200 group-hover:translate-x-1 group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
