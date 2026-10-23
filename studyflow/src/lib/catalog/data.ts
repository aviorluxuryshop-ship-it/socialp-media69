// Statik, doğrulanmış sabitler: dersler, okul türleri, iller.
import type { InterestId, SchoolTypeId } from "@/lib/types";

export interface SubjectMeta {
  id: string;
  name: string;
  short: string;
  /** lucide-react simge adı */
  icon: string;
  group: "sayisal" | "sosyal" | "dil" | "din";
}

export const SUBJECTS: SubjectMeta[] = [
  { id: "matematik", name: "Matematik", short: "Mat", icon: "Sigma", group: "sayisal" },
  { id: "fizik", name: "Fizik", short: "Fiz", icon: "Atom", group: "sayisal" },
  { id: "kimya", name: "Kimya", short: "Kim", icon: "FlaskConical", group: "sayisal" },
  { id: "biyoloji", name: "Biyoloji", short: "Biy", icon: "Dna", group: "sayisal" },
  { id: "turk-dili-ve-edebiyati", name: "Türk Dili ve Edebiyatı", short: "TDE", icon: "BookOpenText", group: "sosyal" },
  { id: "tarih", name: "Tarih", short: "Tar", icon: "Landmark", group: "sosyal" },
  { id: "cografya", name: "Coğrafya", short: "Coğ", icon: "Globe2", group: "sosyal" },
  { id: "felsefe", name: "Felsefe", short: "Fel", icon: "Lightbulb", group: "sosyal" },
  { id: "ingilizce", name: "İngilizce", short: "İng", icon: "Languages", group: "dil" },
  { id: "din-kulturu", name: "Din Kültürü ve Ahlak Bilgisi", short: "DKAB", icon: "Scale", group: "din" },
  { id: "peygamberimizin-hayati", name: "Peygamberimizin Hayatı", short: "PH", icon: "ScrollText", group: "din" },
  { id: "arapca", name: "Arapça", short: "Arp", icon: "Languages", group: "dil" },
  { id: "kuran", name: "Kur'an-ı Kerim", short: "Kur", icon: "BookMarked", group: "din" },
  { id: "fikih", name: "Fıkıh", short: "Fık", icon: "Scale", group: "din" },
  { id: "hadis", name: "Hadis", short: "Had", icon: "ScrollText", group: "din" },
  { id: "siyer", name: "Siyer", short: "Siy", icon: "ScrollText", group: "din" },
  { id: "temel-dini-bilgiler", name: "Temel Dinî Bilgiler", short: "TDB", icon: "BookMarked", group: "din" },
];
export const SUBJECT_BY_ID = new Map(SUBJECTS.map((s) => [s.id, s]));
export const subjectName = (id: string | null | undefined) => (id ? (SUBJECT_BY_ID.get(id)?.name ?? id) : "Genel");

export interface SchoolTypeMeta {
  id: SchoolTypeId;
  name: string;
  /** Hangi resmî kitap listeleri gösterilir */
  kademe: ("ortaogretim" | "aihl")[];
  note: string | null;
}

export const SCHOOL_TYPES: SchoolTypeMeta[] = [
  { id: "anadolu", name: "Anadolu Lisesi", kademe: ["ortaogretim"], note: null },
  {
    id: "fen",
    name: "Fen Lisesi",
    kademe: ["ortaogretim"],
    note: "Resmî portalda Fen Lisesi için ayrı bir ders kitabı listesi doğrulanmadı; ortaöğretim kitapları gösteriliyor. Okulundaki kitabı mutlaka kontrol et.",
  },
  {
    id: "sosyal-bilimler",
    name: "Sosyal Bilimler Lisesi",
    kademe: ["ortaogretim"],
    note: "Resmî portalda bu okul türü için ayrı bir liste doğrulanmadı; ortaöğretim kitapları gösteriliyor. Okulundaki kitabı kontrol et.",
  },
  {
    id: "mtal",
    name: "Mesleki ve Teknik Anadolu Lisesi",
    kademe: ["ortaogretim"],
    note: "Alan/meslek dersleri bu listede yer almaz; ortak dersler gösteriliyor.",
  },
  {
    id: "aihl",
    name: "Anadolu İmam Hatip Lisesi",
    kademe: ["aihl", "ortaogretim"],
    note: "Meslek dersleri (Kur'an, Fıkıh, Hadis, Siyer…) AİHL listesinden, ortak dersler ortaöğretim listesinden gelir.",
  },
  {
    id: "diger",
    name: "Diğer",
    kademe: ["ortaogretim"],
    note: "Okul türüne özel kitaplar gösterilmiyor; ortaöğretim kitapları listelendi. Okulundaki kitabı kontrol et.",
  },
];
export const SCHOOL_BY_ID = new Map(SCHOOL_TYPES.map((s) => [s.id, s]));

export const INTERESTS: { id: InterestId; name: string }[] = [
  { id: "fen-mat", name: "Fen ve matematik" },
  { id: "sosyal", name: "Sosyal bilimler" },
  { id: "dil", name: "Dil" },
  { id: "kararsiz", name: "Henüz karar vermedim" },
];

export const PROVINCES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın",
  "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale",
  "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir",
  "Gaziantep", "Giresun", "Gümüşhane", "Hakkâri", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş",
  "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli", "Kırşehir", "Kocaeli",
  "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye",
  "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas", "Tekirdağ", "Tokat", "Trabzon",
  "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
