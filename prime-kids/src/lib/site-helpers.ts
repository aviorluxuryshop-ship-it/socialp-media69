import type { LegalCompany } from "@/content/legal";
import { isTestPayment, site } from "@/data/site";

export const fmt = (n: number) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 }).format(n) + " ₺";

export const waLink = (text?: string) =>
  `https://wa.me/${site.contact.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const telLink = `tel:${site.contact.phone}`;
export const mailLink = `mailto:${site.contact.email}`;

/** Yasal metinlerin beslendiği şirket bilgileri — hepsi site.ts'den gelir. */
export const legalCompany: LegalCompany = {
  name: site.company.legalName,
  brand: site.name,
  mersis: site.company.mersis,
  taxOffice: site.company.taxOffice,
  taxNo: site.company.taxNo,
  address: site.company.address,
  phone: site.contact.phoneDisplay,
  email: site.contact.email,
  kepEmail: site.company.kepEmail,
  siteUrl: site.url,
  returnDays: site.shipping.returnDays,
  freeShippingThreshold: site.shipping.freeThreshold,
  shippingFee: site.shipping.fee,
  dispatchDays: site.shipping.dispatchDays,
  deliveryDays: site.shipping.deliveryDays,
  carrier: site.shipping.carrier,
  // Deneme (mock) sağlayıcıda gerçek bir ödeme kuruluşu adı verilmez.
  paymentProvider: site.payment.provider === "mock" ? "" : site.payment.legalName,
  testPayment: isTestPayment,
  returnAddress: site.shipping.returnAddress,
  returnShippingPolicy: site.shipping.returnShippingPolicy,
};
