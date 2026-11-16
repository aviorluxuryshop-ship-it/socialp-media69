/**
 * Ödeme formu alanları ve doğrulama. Aynı kurallar hem tarayıcıda (anında hata mesajı)
 * hem sunucuda (/api/checkout) çalışır.
 */
export type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // 10 haneli, başında 0 olmadan (5xxxxxxxxx)
  city: string;
  district: string;
  address: string;
  postalCode: string;
  note: string;
  giftWrap: boolean;
  giftNote: string;
  invoiceType: "bireysel" | "kurumsal";
  companyName: string;
  taxOffice: string;
  taxNo: string;
};

export type CustomerField = keyof Customer;
export type FieldErrors = Partial<Record<CustomerField, string>>;

export const emptyCustomer: Customer = {
  firstName: "", lastName: "", email: "", phone: "", city: "", district: "", address: "",
  postalCode: "", note: "", giftWrap: false, giftNote: "", invoiceType: "bireysel",
  companyName: "", taxOffice: "", taxNo: "",
};

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function normalizePhone(v: string): string {
  let d = v.replace(/\D/g, "");
  if (d.startsWith("90") && d.length === 12) d = d.slice(2);
  if (d.startsWith("0") && d.length === 11) d = d.slice(1);
  return d;
}

export function validateCustomer(input: unknown): { values: Customer; errors: FieldErrors } {
  const r = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const values: Customer = {
    firstName: str(r.firstName, 60),
    lastName: str(r.lastName, 60),
    email: str(r.email, 120).toLowerCase(),
    phone: normalizePhone(str(r.phone, 30)),
    city: str(r.city, 40),
    district: str(r.district, 60),
    address: str(r.address, 300),
    postalCode: str(r.postalCode, 5),
    note: str(r.note, 300),
    giftWrap: r.giftWrap === true,
    giftNote: str(r.giftNote, 200),
    invoiceType: r.invoiceType === "kurumsal" ? "kurumsal" : "bireysel",
    companyName: str(r.companyName, 120),
    taxOffice: str(r.taxOffice, 60),
    taxNo: str(r.taxNo, 11).replace(/\D/g, ""),
  };

  const errors: FieldErrors = {};
  if (values.firstName.length < 2) errors.firstName = "Adınızı yazın.";
  if (values.lastName.length < 2) errors.lastName = "Soyadınızı yazın.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
    errors.email = "Geçerli bir e-posta adresi yazın (ör. ad@ornek.com).";
  if (!/^[2-5]\d{9}$/.test(values.phone))
    errors.phone = "Telefon numaranızı 10 haneli yazın (ör. 0532 123 45 67).";
  if (values.city.length < 2) errors.city = "İl seçin.";
  if (values.district.length < 2) errors.district = "İlçeyi yazın.";
  if (values.address.length < 15)
    errors.address = "Adresi mahalle, cadde/sokak ve kapı numarasıyla birlikte yazın.";
  if (values.postalCode && !/^\d{5}$/.test(values.postalCode)) errors.postalCode = "Posta kodu 5 haneli olmalı.";
  if (values.invoiceType === "kurumsal") {
    if (values.companyName.length < 3) errors.companyName = "Firma unvanını yazın.";
    if (values.taxOffice.length < 2) errors.taxOffice = "Vergi dairesini yazın.";
    if (!/^\d{10,11}$/.test(values.taxNo)) errors.taxNo = "Vergi numarası 10, TCKN 11 haneli olmalı.";
  }
  return { values, errors };
}

/** /api/checkout istek ve yanıt biçimi. */
export type CheckoutRequest = {
  lines: unknown;
  customer: unknown;
  consents: { preInfo: boolean; distanceSales: boolean };
};

export type CheckoutResponse =
  | { ok: true; orderId: string; session: import("./payment/types").PaymentSession }
  | { ok: false; message: string; fieldErrors?: FieldErrors; cartChanged?: boolean };

export const cities = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum",
  "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
