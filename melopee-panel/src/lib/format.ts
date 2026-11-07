const tl = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
const tlCompact = new Intl.NumberFormat("tr-TR", { notation: "compact", maximumFractionDigits: 1 });
const num = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const pct = new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 0 });

export const money = (n: number) => tl.format(Math.round(n));
/** Grafik eksenleri için kısa biçim: 12,5 B ₺ */
export const moneyShort = (n: number) => (Math.abs(n) < 1000 ? `${num.format(n)} ₺` : `${tlCompact.format(n)} ₺`);
export const number = (n: number) => num.format(n);
export const percent = (ratio: number) => pct.format(Number.isFinite(ratio) ? ratio : 0);

/** Önceki döneme göre değişim (oran). Önceki 0 ise null. */
export function change(cur: number, prev: number): number | null {
  if (!prev) return null;
  return (cur - prev) / Math.abs(prev);
}

export function minutesLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} dk`;
  return m ? `${h} sa ${m} dk` : `${h} sa`;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toLocaleUpperCase("tr-TR"))
    .join("");
}

/** Türkçe duyarlı, büyük/küçük harf ve aksan farkını yok sayan arama. */
export function normalizeSearch(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** wa.me bağlantısı için uluslararası biçim (Türkiye varsayılır). */
export function whatsappLink(phone: string, text?: string): string {
  let d = phoneDigits(phone);
  if (d.startsWith("0")) d = "9" + d;
  else if (!d.startsWith("90")) d = "90" + d;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
