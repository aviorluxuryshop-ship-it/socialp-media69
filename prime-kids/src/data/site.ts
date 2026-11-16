/**
 * Mağaza ayarları — tek yerden yönetilir.
 * ⚠️ "ÖRNEK" işaretli değerler yer tutucudur; yayına almadan önce gerçekleriyle değiştirin.
 */
export const site = {
  name: "Prime Kids",
  tagline: "Küçük boyda büyük stil",
  description:
    "Prime Kids: kız ve erkek çocuklar için rahat, modern ve iddialı takımlar. Şardonlu eşofman, denim, kargo ve daha fazlası.",
  url: "https://primekids.example", // ÖRNEK — gerçek alan adı
  currency: "TRY",

  // Siparişler WhatsApp üzerinden alınır (ödeme altyapısı bağlanana kadar).
  whatsapp: "905000000000", // ÖRNEK — ülke kodlu, + ve boşluksuz (ör. 905xxxxxxxxx)
  instagram: "primekids", // ÖRNEK
  email: "merhaba@primekids.example", // ÖRNEK

  // Teslimat / iade
  freeShippingThreshold: 1500, // ÖRNEK — TL
  shippingFee: 79, // ÖRNEK — TL
  returnDays: 14, // 6502 sayılı Kanun: mesafeli satışta yasal cayma hakkı 14 gün
};

export const sizeGuide = [
  { age: "2 yaş", height: "92 cm" },
  { age: "3 yaş", height: "98 cm" },
  { age: "4 yaş", height: "104 cm" },
  { age: "5 yaş", height: "110 cm" },
  { age: "6 yaş", height: "116 cm" },
  { age: "7 yaş", height: "122 cm" },
  { age: "8 yaş", height: "128 cm" },
  { age: "9 yaş", height: "134 cm" },
  { age: "10 yaş", height: "140 cm" },
  { age: "11 yaş", height: "146 cm" },
  { age: "12 yaş", height: "152 cm" },
  { age: "13 yaş", height: "158 cm" },
  { age: "14 yaş", height: "164 cm" },
];
