"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TotalsRows } from "./CartParts";
import CheckoutSteps from "./CheckoutSteps";
import Icon from "./Icon";
import { isTestPayment, site } from "@/data/site";
import { useCart } from "@/lib/cart";
import {
  cities, emptyCustomer, validateCustomer,
  type CheckoutRequest, type CheckoutResponse, type Customer, type CustomerField, type FieldErrors,
} from "@/lib/checkout";
import type { PaymentSession } from "@/lib/payment/types";
import { fmt, waLink } from "@/lib/site-helpers";

const DRAFT_KEY = "primekids.checkout.v1";
const order: CustomerField[] = ["firstName", "lastName", "email", "phone", "city", "district", "address", "postalCode", "companyName", "taxOffice", "taxNo"];

/** Sağlayıcının istediği yöntemle ödeme adımını açar (yönlendirme ya da gizli form). */
function launch(session: Exclude<PaymentSession, { kind: "iframe" }>) {
  if (session.kind === "redirect") {
    window.location.assign(session.url);
    return;
  }
  const form = document.createElement("form");
  form.method = "POST";
  form.action = session.action;
  for (const [k, v] of Object.entries(session.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = k;
    input.value = v;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export default function Checkout({ failed }: { failed: boolean }) {
  const { lines, totals, ready } = useCart();
  const [c, setC] = useState<Customer>(emptyCustomer);
  const [consents, setConsents] = useState({ preInfo: false, distanceSales: false });
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<FieldErrors>({});
  const [alert, setAlert] = useState<string | null>(failed ? "Ödeme tamamlanamadı; kartınızdan tutar çekilmedi. Bilgilerinizi kontrol edip yeniden deneyebilirsiniz." : null);
  const [busy, setBusy] = useState(false);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);
  const summaryRef = useRef<HTMLDetailsElement>(null);
  const hasItems = totals.items.length > 0;

  // Masaüstünde sipariş özeti açık gelir; mobilde yer kaplamaması için katlıdır.
  useEffect(() => {
    if (summaryRef.current && window.matchMedia("(min-width: 1024px)").matches) summaryRef.current.open = true;
  }, [ready, hasItems]);

  // Form taslağı sekme kapanana kadar saklanır: ödeme adımından geri dönen kullanıcı yeniden yazmaz.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setC(validateCustomer(JSON.parse(raw)).values);
    } catch {}
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(c));
    } catch {}
  }, [c]);

  const set = <K extends CustomerField>(k: K, v: Customer[K]) => {
    setC((cur) => ({ ...cur, [k]: v }));
    setServerErrors((e) => ({ ...e, [k]: undefined }));
  };

  const clientErrors = validateCustomer(c).errors;
  const errors: FieldErrors = submitted ? { ...clientErrors, ...serverErrors } : {};
  const consentError = submitted && !(consents.preInfo && consents.distanceSales);

  function fail(message: string, focusId?: string) {
    setAlert(message);
    requestAnimationFrame(() => {
      const el = focusId ? document.getElementById(focusId) : null;
      if (el) el.focus();
      else alertRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setSubmitted(true);
    setAlert(null);

    const firstBad = order.find((k) => clientErrors[k]);
    if (firstBad) return fail("Lütfen işaretli alanları kontrol edin.", `f-${firstBad}`);
    if (!consents.preInfo) return fail("Devam etmek için sözleşme onaylarını işaretleyin.", "onay-preInfo");
    if (!consents.distanceSales) return fail("Devam etmek için sözleşme onaylarını işaretleyin.", "onay-distanceSales");

    setBusy(true);
    try {
      const body: CheckoutRequest = { lines, customer: c, consents };
      const res = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json()) as CheckoutResponse;
      if (!data.ok) {
        setServerErrors(data.fieldErrors ?? {});
        setBusy(false);
        const bad = order.find((k) => data.fieldErrors?.[k]);
        return fail(data.message, bad ? `f-${bad}` : undefined);
      }
      if (data.session.kind === "iframe") {
        setFrameUrl(data.session.url);
        setBusy(false);
        return;
      }
      launch(data.session); // sayfa değişene kadar düğme meşgul kalır
    } catch {
      setBusy(false);
      fail("Bağlantı kurulamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.");
    }
  }

  if (!ready) return <div className="container-x grid min-h-[70vh] place-items-center text-center text-mute" role="status">Yükleniyor…</div>;

  if (!totals.items.length)
    return (
      <div className="container-x flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="h-display text-[32px] sm:text-5xl">Sepetiniz boş</h1>
        <p className="mx-auto mt-3 max-w-sm text-mute">Ödemeye geçmek için önce sepetinize ürün ekleyin.</p>
        <Link href="/urunler" className="btn-primary mt-8">Ürünlere Git <Icon name="arrow" size={18} /></Link>
      </div>
    );

  if (frameUrl)
    return (
      <div className="container-x pt-8 sm:pt-12">
        <CheckoutSteps current={3} />
        <h1 className="h-display mt-6 text-[28px] sm:text-4xl">Güvenli ödeme</h1>
        <p className="mt-2 text-[14.5px] text-mute">Ödenecek tutar: <strong className="text-ink">{fmt(totals.total)}</strong>. Kart bilgileriniz ödeme kuruluşunun güvenli formunda işlenir.</p>
        <iframe src={frameUrl} title="Güvenli ödeme formu" className="mt-6 h-[720px] w-full rounded-2xl border border-line bg-white" />
      </div>
    );

  const field = (k: CustomerField) => ({
    id: `f-${k}`,
    name: k,
    value: c[k] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never),
    "aria-invalid": !!errors[k],
    "aria-describedby": errors[k] ? `f-${k}-hata` : undefined,
    className: "input",
  });
  const err = (k: CustomerField) => errors[k] && <p id={`f-${k}-hata`} className="mt-1.5 text-[13px] text-alert">{errors[k]}</p>;

  return (
    <div className="container-x pt-8 sm:pt-12">
      <CheckoutSteps current={2} />
      <h1 className="h-display mt-6 text-[32px] sm:text-5xl">Teslimat bilgileri</h1>
      <p className="mt-2 text-[14.5px] text-mute">Üyelik gerekmez. <Link href="/sepet" className="link">Sepete dön</Link></p>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
        {/* Sipariş özeti: mobilde üstte ve katlanır, masaüstünde sağda sabit */}
        <aside aria-label="Sipariş özeti" className="lg:sticky lg:top-28 lg:order-2 lg:self-start">
          <details ref={summaryRef} className="card group">
            <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-3 px-5 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                Sipariş özeti ({totals.count} ürün)
                <Icon name="plus" size={16} className="transition-transform duration-200 group-open:rotate-45" />
              </span>
              <span className="tabular-nums">{fmt(totals.total)}</span>
            </summary>
            <div className="border-t border-line px-5 pb-5">
              <ul className="divide-y divide-line">
                {totals.items.map((i) => (
                  <li key={`${i.slug}-${i.colorId}-${i.size}`} className="flex gap-3.5 py-3.5">
                    <div className="relative h-[84px] w-[56px] shrink-0 overflow-hidden rounded-lg bg-sand">
                      <Image src={i.image} alt="" fill sizes="56px" className="object-cover object-top" />
                    </div>
                    <div className="min-w-0 flex-1 text-[14px]">
                      <p className="font-semibold leading-snug">{i.name}</p>
                      <p className="mt-0.5 text-[13px] text-mute">{i.colorName} · {i.size} · {i.qty} adet</p>
                    </div>
                    <p className="shrink-0 text-[14px] font-semibold tabular-nums">{fmt(i.lineTotal)}</p>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line pt-4"><TotalsRows totals={totals} /></div>
            </div>
          </details>
          <ul className="mt-4 hidden space-y-2.5 px-1 text-[13.5px] text-mute lg:block">
            <li className="flex gap-2.5"><Icon name="lock" size={17} className="mt-0.5 shrink-0 text-pine" /> Kart bilgileriniz {site.name} tarafından görülmez ve saklanmaz.</li>
            <li className="flex gap-2.5"><Icon name="truck" size={17} className="mt-0.5 shrink-0 text-pine" /> {site.shipping.dispatchDays} içinde kargoda, teslimat {site.shipping.deliveryDays}.</li>
            <li className="flex gap-2.5"><Icon name="return" size={17} className="mt-0.5 shrink-0 text-pine" /> {site.shipping.returnDays} gün içinde cayma hakkı.</li>
          </ul>
        </aside>

        <form noValidate onSubmit={submit} className="lg:order-1">
          <div ref={alertRef} role="alert" aria-live="assertive">
            {alert && (
              <p className="mb-6 rounded-xl border border-alert/30 bg-alert/5 px-4 py-3.5 text-[14.5px] font-medium text-alert">{alert}</p>
            )}
          </div>

          {isTestPayment && (
            <div className="mb-7 rounded-2xl border border-pine/30 bg-pine-soft p-5 text-[14.5px] leading-relaxed" role="note">
              <p className="font-semibold text-pine-dark">Deneme modu: şu anda gerçek ödeme alınmıyor</p>
              <p className="mt-1.5 text-ink/80">
                Online ödeme altyapımız hazırlık aşamasında. “Ödemeye geç” düğmesi sizi bir deneme ödeme sayfasına götürür;
                kart bilgisi istenmez, tutar çekilmez ve sipariş oluşturulmaz. Gerçek sipariş vermek için{" "}
                <a
                  href={waLink(
                    `Merhaba, sipariş vermek istiyorum:\n${totals.items.map((i) => `• ${i.name} — ${i.colorName}, ${i.size} × ${i.qty}`).join("\n")}\nToplam: ${fmt(totals.total)}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link"
                >
                  WhatsApp’tan yazabilirsiniz
                </a>.
              </p>
            </div>
          )}

          <fieldset>
            <legend className="font-display text-[19px] font-bold">İletişim</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="f-firstName" className="label">Ad</label><input {...field("firstName")} autoComplete="given-name" required />{err("firstName")}</div>
              <div><label htmlFor="f-lastName" className="label">Soyad</label><input {...field("lastName")} autoComplete="family-name" required />{err("lastName")}</div>
              <div>
                <label htmlFor="f-email" className="label">E-posta</label>
                <input {...field("email")} type="email" inputMode="email" autoComplete="email" required />
                {err("email") || <p className="mt-1.5 text-[12.5px] text-mute">Sipariş onayı ve kargo takip numarası bu adrese gönderilir.</p>}
              </div>
              <div>
                <label htmlFor="f-phone" className="label">Cep telefonu</label>
                <input {...field("phone")} type="tel" inputMode="tel" autoComplete="tel-national" placeholder="05__ ___ __ __" required />
                {err("phone") || <p className="mt-1.5 text-[12.5px] text-mute">Kargo teslimatı için gereklidir.</p>}
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-9">
            <legend className="font-display text-[19px] font-bold">Teslimat adresi</legend>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="f-city" className="label">İl</label>
                <select {...field("city")} autoComplete="address-level1" required>
                  <option value="">Seçin</option>
                  {cities.map((x) => <option key={x}>{x}</option>)}
                </select>
                {err("city")}
              </div>
              <div><label htmlFor="f-district" className="label">İlçe</label><input {...field("district")} autoComplete="address-level2" required />{err("district")}</div>
              <div className="sm:col-span-2">
                <label htmlFor="f-address" className="label">Adres</label>
                <textarea {...field("address")} rows={3} autoComplete="street-address" placeholder="Mahalle, cadde/sokak, bina ve daire no" required />
                {err("address")}
              </div>
              <div>
                <label htmlFor="f-postalCode" className="label">Posta kodu <span className="font-normal text-mute">(isteğe bağlı)</span></label>
                <input {...field("postalCode")} inputMode="numeric" autoComplete="postal-code" maxLength={5} />
                {err("postalCode")}
              </div>
            </div>
          </fieldset>

          <fieldset className="mt-9">
            <legend className="font-display text-[19px] font-bold">Fatura ve notlar</legend>
            <p className="mt-2 text-[14px] text-mute">Faturanız teslimat adresinize göre düzenlenir ve e-posta ile gönderilir.</p>
            <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 text-[14.5px]">
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-ink" checked={c.invoiceType === "kurumsal"} onChange={(e) => set("invoiceType", e.target.checked ? "kurumsal" : "bireysel")} />
              Kurumsal fatura istiyorum
            </label>
            {c.invoiceType === "kurumsal" && (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><label htmlFor="f-companyName" className="label">Firma unvanı</label><input {...field("companyName")} autoComplete="organization" />{err("companyName")}</div>
                <div><label htmlFor="f-taxOffice" className="label">Vergi dairesi</label><input {...field("taxOffice")} />{err("taxOffice")}</div>
                <div><label htmlFor="f-taxNo" className="label">Vergi no / TCKN</label><input {...field("taxNo")} inputMode="numeric" maxLength={11} />{err("taxNo")}</div>
              </div>
            )}
            {site.shipping.giftWrap && (
              <>
                <label className="mt-1 flex min-h-[44px] cursor-pointer items-center gap-3 text-[14.5px]">
                  <input type="checkbox" className="h-5 w-5 shrink-0 accent-ink" checked={c.giftWrap} onChange={(e) => set("giftWrap", e.target.checked)} />
                  Hediye paketi istiyorum <span className="text-mute">(ücretsiz)</span>
                </label>
                {c.giftWrap && (
                  <div className="mt-3">
                    <label htmlFor="f-giftNote" className="label">Hediye notu <span className="font-normal text-mute">(isteğe bağlı)</span></label>
                    <input {...field("giftNote")} maxLength={200} placeholder="Pakete eklenecek kısa not" />
                  </div>
                )}
              </>
            )}
            <div className="mt-4">
              <label htmlFor="f-note" className="label">Sipariş notu <span className="font-normal text-mute">(isteğe bağlı)</span></label>
              <textarea {...field("note")} rows={2} maxLength={300} placeholder="Kargo görevlisine ya da bize iletmek istedikleriniz" />
            </div>
          </fieldset>

          <fieldset className="mt-9 rounded-2xl border border-line bg-white/60 p-5" aria-describedby={consentError ? "onay-hata" : undefined}>
            <legend className="sr-only">Sözleşme onayları</legend>
            {([
              ["preInfo", "on-bilgilendirme-formu", "Ön Bilgilendirme Formu"],
              ["distanceSales", "mesafeli-satis-sozlesmesi", "Mesafeli Satış Sözleşmesi"],
            ] as const).map(([key, slug, title]) => (
              <div key={key} className="flex min-h-[44px] items-start gap-3 py-1.5 text-[14.5px] leading-relaxed">
                <input
                  id={`onay-${key}`}
                  type="checkbox"
                  required
                  className="mt-0.5 h-5 w-5 shrink-0 accent-ink"
                  checked={consents[key]}
                  onChange={(e) => setConsents((s) => ({ ...s, [key]: e.target.checked }))}
                  aria-invalid={consentError && !consents[key]}
                />
                <label htmlFor={`onay-${key}`}>
                  <a href={`/yasal/${slug}`} target="_blank" rel="noopener" className="link">{title}</a>’ni okudum, kabul ediyorum. <span className="text-mute">(zorunlu)</span>
                </label>
              </div>
            ))}
            {consentError && <p id="onay-hata" className="mt-2 text-[13px] font-medium text-alert">Siparişi tamamlamak için iki onay da gereklidir.</p>}
            <p className="mt-3 border-t border-line pt-3 text-[13px] leading-relaxed text-mute">
              Kişisel verileriniz, siparişinizi hazırlamak ve teslim etmek amacıyla{" "}
              <a href="/yasal/kvkk-aydinlatma-metni" target="_blank" rel="noopener" className="link">KVKK Aydınlatma Metni</a> kapsamında işlenir.
            </p>
          </fieldset>

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full py-4 text-base">
            <Icon name="lock" size={18} />
            {busy ? "Ödeme sayfası açılıyor…" : `Ödemeye geç · ${fmt(totals.total)}`}
          </button>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-mute">
            {isTestPayment
              ? "Deneme modu: bir sonraki adımda kart bilgisi istenmez, tutar çekilmez ve sipariş oluşturulmaz."
              : `Ödeme bir sonraki adımda, ödeme kuruluşunun güvenli sayfasında kartla yapılır. Kart bilgileriniz ${site.name} tarafından görülmez ve saklanmaz.`}
          </p>
        </form>
      </div>
    </div>
  );
}
