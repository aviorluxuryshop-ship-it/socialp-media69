// Tanıtım verisi: bugünden geriye ~4 ay, ileriye 3 hafta. Sabit tohumla üretilir, her kurulumda aynı görünür.
import { SERIES } from "./constants";
import { addDays, addMonths, daysBetween, diffDays, endOfMonth, minToTime, startOfMonth, weekday } from "./dates";
import type {
  AppData,
  Appointment,
  AppointmentStatus,
  Branch,
  Customer,
  CustomerSource,
  PaymentMethod,
  Service,
  Settings,
  Staff,
  Transaction,
} from "./types";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const DEFAULT_SETTINGS: Settings = {
  studioName: "Melopee Nail Art Studio",
  ownerName: "İşletme Sahibi",
  ownerPin: "0000",
  slotMinutes: 15,
};

export const DEFAULT_BRANCHES: Branch[] = [
  {
    id: "b1",
    name: "Ataşehir Şube",
    address: "Atatürk Mah., Ertuğrul Gazi Sk., Metropol İstanbul AVM, 34758 Ataşehir/İstanbul",
    phone: "0544 849 94 34",
    color: SERIES[0],
    openHour: 10,
    closeHour: 21,
  },
  {
    id: "b2",
    name: "Emaar Şube",
    address: "Emaar Rezidansları, Ünalan, Libadiye Cd. D:82/E, E/Heights Blok, Kat 8 No 804, 34700 Üsküdar/İstanbul",
    phone: "0544 881 94 34",
    color: SERIES[1],
    openHour: 10,
    closeHour: 20,
  },
];

/** Hizmetler ve süreler web sitesindeki listeden; fiyatlar örnektir, Hizmetler sayfasından güncellenir. */
export const DEFAULT_SERVICES: Service[] = [
  { id: "s01", name: "Protez Tırnak", category: "Tırnak", durationMin: 120, price: 2200, active: true },
  { id: "s02", name: "Jel Güçlendirme", category: "Tırnak", durationMin: 90, price: 1500, active: true },
  { id: "s03", name: "Manikür", category: "Tırnak", durationMin: 45, price: 650, active: true },
  { id: "s04", name: "Kalıcı Oje", category: "Tırnak", durationMin: 60, price: 950, active: true },
  { id: "s05", name: "Nail Art", category: "Tırnak", durationMin: 90, price: 1400, active: true },
  { id: "s06", name: "Pedikür", category: "Ayak", durationMin: 75, price: 1000, active: true },
  { id: "s07", name: "Pedikür & Kalıcı Oje", category: "Ayak", durationMin: 105, price: 1600, active: true },
  { id: "s08", name: "Kirpik Lifting", category: "Kirpik & Kaş", durationMin: 60, price: 1200, active: true },
  { id: "s09", name: "Kaş Laminasyonu", category: "Kirpik & Kaş", durationMin: 60, price: 1100, active: true },
];

/** Hizmetlerin talep ağırlığı (tanıtım verisi için). */
const SERVICE_WEIGHT: Record<string, number> = {
  s01: 9, s02: 7, s03: 10, s04: 16, s05: 5, s06: 5, s07: 6, s08: 4, s09: 3,
};

const STAFF_SEED: Omit<Staff, "id" | "color" | "startDate">[] = [
  { name: "Ece Yıldız", branchId: "b1", role: "Kıdemli Nail Artist", phone: "0500 100 11 01", commissionRate: 20, salary: 34000, workDays: [1, 2, 3, 4, 5, 6], pin: "1111", active: true },
  { name: "Selin Aydın", branchId: "b1", role: "Nail Artist", phone: "0500 100 11 02", commissionRate: 15, salary: 30000, workDays: [0, 2, 3, 4, 5, 6], pin: "2222", active: true },
  { name: "Derya Kaya", branchId: "b1", role: "Manikür & Pedikür Uzmanı", phone: "0500 100 11 03", commissionRate: 15, salary: 28000, workDays: [1, 2, 3, 4, 5, 6], pin: "3333", active: true },
  { name: "Buse Demir", branchId: "b2", role: "Kıdemli Nail Artist", phone: "0500 100 11 04", commissionRate: 20, salary: 34000, workDays: [1, 2, 3, 4, 5, 6], pin: "4444", active: true },
  { name: "İrem Çelik", branchId: "b2", role: "Nail Artist", phone: "0500 100 11 05", commissionRate: 15, salary: 30000, workDays: [0, 1, 3, 4, 5, 6], pin: "5555", active: true },
  { name: "Naz Şahin", branchId: "b2", role: "Stajyer", phone: "0500 100 11 06", commissionRate: 10, salary: 22000, workDays: [2, 3, 4, 5, 6, 0], pin: "6666", active: true },
];

const FIRST = [
  "Ayşe", "Zeynep", "Elif", "Merve", "Büşra", "Esra", "Gizem", "Ceren", "Defne", "Ebru", "Aslı", "Pınar", "Sena", "Melis",
  "Damla", "Tuğba", "Özge", "Gamze", "Burcu", "Cansu", "Nil", "Ilgın", "Yağmur", "Ezgi", "Hande", "Seda", "Didem", "Şule",
  "Bade", "Lara", "Duru", "Ece", "Irmak", "Nehir", "Ada", "Beril", "Çağla", "Dilara", "Feyza", "Gül",
];
const LAST = [
  "Yılmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldırım", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç",
  "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Erdoğan", "Güneş", "Aksoy", "Tekin", "Ünal",
];
const NOTES = [
  "Badem şekli tercih ediyor.",
  "Kısa ve doğal tonlar sever.",
  "Nude ve pastel renkler.",
  "Her ay dolguya gelir.",
  "Kütikül bölgesi hassas.",
  "Koyu bordo favorisi.",
  "Çay yerine su ikram edin.",
  "",
  "",
  "",
];
const ALLERGIES = ["", "", "", "", "", "", "Lateks hassasiyeti", "Aseton kokusundan rahatsız oluyor", "Parfümlü kremlere alerji"];
const SOURCES: CustomerSource[] = ["Instagram", "Instagram", "Instagram", "Tavsiye", "Tavsiye", "Google", "Yoldan", "Diğer"];

function pickWeighted<T>(rnd: () => number, items: T[], weight: (t: T) => number): T {
  const total = items.reduce((s, t) => s + weight(t), 0);
  let r = rnd() * total;
  for (const t of items) {
    r -= weight(t);
    if (r <= 0) return t;
  }
  return items[items.length - 1]!;
}

const pad = (n: number, w: number) => String(n).padStart(w, "0");
const CUSTOMER_COUNT = 520;

export function buildDemoData(today: string, nowMin: number): AppData {
  const rnd = mulberry32(20261107);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]!;

  const first = addMonths(startOfMonth(today), -4);
  const last = addDays(today, 21);

  const staff: Staff[] = STAFF_SEED.map((s, i) => {
    const inBranch = STAFF_SEED.slice(0, i).filter((x) => x.branchId === s.branchId).length;
    return {
      ...s,
      id: `p${i + 1}`,
      color: SERIES[(inBranch * 2 + (s.branchId === "b2" ? 1 : 0)) % SERIES.length]!,
      startDate: addMonths(first, -6 - i * 2),
    };
  });

  // Müşteriler — her birinin bir "ev" şubesi ve çoğunlukla tercih ettiği bir personeli var.
  const customers: Customer[] = [];
  const homeBranch: Record<string, string> = {};
  const usedNames = new Set<string>();
  for (let i = 0; customers.length < CUSTOMER_COUNT && i < 5000; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`;
    if (usedNames.has(name)) continue;
    usedNames.add(name);
    const branchId = rnd() < 0.55 ? "b1" : "b2";
    const pool = staff.filter((s) => s.branchId === branchId);
    const n = customers.length + 1;
    const id = `c${pad(n, 3)}`;
    homeBranch[id] = branchId;
    const bMonth = 1 + Math.floor(rnd() * 12);
    const bDay = 1 + Math.floor(rnd() * 28);
    customers.push({
      id,
      name,
      phone: `0500 ${pad(200 + Math.floor(n / 100), 3)} ${pad(Math.floor(rnd() * 100), 2)} ${pad(n % 100, 2)}`,
      email: rnd() < 0.4 ? `${name.split(" ")[0]!.toLocaleLowerCase("tr-TR").replace(/[^a-z]/g, "x")}${n}@ornek.com` : "",
      birthday: rnd() < 0.7 ? `${pad(bMonth, 2)}-${pad(bDay, 2)}` : "",
      notes: pick(NOTES),
      allergies: pick(ALLERGIES),
      vip: rnd() < 0.12,
      source: pick(SOURCES),
      preferredStaffId: rnd() < 0.75 ? pick(pool).id : null,
      createdAt: first,
    });
  }
  // Son ayda katılanlar ("yeni müşteri" metrikleri için).
  const newcomers = new Set(customers.slice(-Math.round(customers.length * 0.07)).map((c) => c.id));
  // Bir süredir gelmeyenler (geri kazanım listesi için).
  const lapsed = new Set(customers.slice(0, Math.round(customers.length * 0.05)).map((c) => c.id));
  const joinDate: Record<string, string> = {};
  customers.forEach((c, i) => {
    const span = Math.max(1, diffDays(first, today) - 30);
    joinDate[c.id] = newcomers.has(c.id)
      ? addDays(today, -Math.floor(rnd() * 28) - 1)
      : i % 2 === 0
        ? addDays(first, Math.floor(rnd() * 10))
        : addDays(first, Math.floor(rnd() * span));
  });

  const services = DEFAULT_SERVICES;
  const appointments: Appointment[] = [];
  let aid = 0;

  for (const day of daysBetween(first, last)) {
    const wd = weekday(day);
    const ahead = day > today ? diffDays(today, day) : 0;
    // Hafta sonu daha yoğun, pazartesi daha sakin; ileri tarihler daha seyrek dolu.
    const busy = (wd === 6 ? 0.92 : wd === 5 ? 0.85 : wd === 1 ? 0.6 : wd === 0 ? 0.7 : 0.74) * (day > today ? Math.max(0.15, 0.85 - ahead * 0.045) : 1);

    for (const branch of DEFAULT_BRANCHES) {
      const branchStaff = staff.filter((s) => s.branchId === branch.id && s.workDays.includes(wd));
      const candidates = customers.filter((c) => homeBranch[c.id] === branch.id && joinDate[c.id]! <= day && !(lapsed.has(c.id) && day > addDays(today, -60)));
      if (!candidates.length) continue;
      const seenToday = new Set<string>();
      for (const s of branchStaff) {
        let t = branch.openHour * 60 + (rnd() < 0.5 ? 0 : 30);
        const close = branch.closeHour * 60;
        while (t < close - 30) {
          if (rnd() > busy) {
            t += rnd() < 0.5 ? 30 : 60;
            continue;
          }
          const svc = pickWeighted(rnd, services, (x) => SERVICE_WEIGHT[x.id] ?? 1);
          if (t + svc.durationMin > close) break;
          // Müşteri: tercih ettiği personel bu kişi olanlar daha olası.
          const cust = pickWeighted(rnd, candidates, (c) => (seenToday.has(c.id) ? 0 : (c.preferredStaffId === s.id ? 5 : c.preferredStaffId ? 0.4 : 1.2) * (c.vip ? 1.6 : 1)));
          if (seenToday.has(cust.id)) break;
          seenToday.add(cust.id);
          let price = svc.price;
          const extra = rnd();
          if (extra < 0.14 && svc.category === "Tırnak" && svc.id !== "s05") price += pick([200, 300, 400]);
          else if (extra > 0.95) price = Math.round((price * 0.9) / 10) * 10;
          const endMin = t + svc.durationMin;
          let status: AppointmentStatus;
          if (day < today || (day === today && endMin <= nowMin)) {
            const r = rnd();
            status = r < 0.9 ? "completed" : r < 0.96 ? "cancelled" : "noshow";
          } else {
            status = day === today || rnd() < 0.55 ? "confirmed" : "planned";
            if (rnd() < 0.03) status = "cancelled";
          }
          const pr = rnd();
          const payment: PaymentMethod | null = status === "completed" ? (pr < 0.62 ? "kart" : pr < 0.9 ? "nakit" : "havale") : null;
          aid++;
          appointments.push({
            id: `a${pad(aid, 5)}`,
            branchId: branch.id,
            staffId: s.id,
            customerId: cust.id,
            serviceId: svc.id,
            date: day,
            start: minToTime(t),
            durationMin: svc.durationMin,
            price,
            status,
            payment,
            note: rnd() < 0.08 ? pick(["İlk kez geliyor.", "Pinterest görseli getirecek.", "Biraz geç kalabilir.", "Kızıyla birlikte gelecek."]) : "",
            createdAt: addDays(day, -Math.floor(rnd() * 14) - 1),
          });
          t = endMin + (rnd() < 0.6 ? 0 : 15);
        }
      }
    }
  }

  // İlk randevu tarihinden müşteri kayıt tarihi.
  for (const c of customers) {
    const firstVisit = appointments.find((a) => a.customerId === c.id)?.date;
    c.createdAt = firstVisit ? addDays(firstVisit, -Math.floor(rnd() * 5)) : joinDate[c.id]!;
  }

  // Gelir / gider kayıtları.
  const transactions: Transaction[] = [];
  let tid = 0;
  const tx = (t: Omit<Transaction, "id">) => {
    if (t.date > today) return;
    tid++;
    transactions.push({ ...t, id: `t${pad(tid, 4)}` });
  };
  const RENT: Record<string, number> = { b1: 85000, b2: 65000 };
  for (let m = 0; m <= 4; m++) {
    const ms = addMonths(first, m);
    for (const branch of DEFAULT_BRANCHES) {
      const b = branch.id;
      tx({ branchId: b, type: "expense", category: "Kira", amount: RENT[b]!, date: ms, note: "Aylık kira", payment: "havale" });
      // Maaş + bir önceki ayın primi, ayın 5'inde.
      const prevStart = addMonths(ms, -1);
      const prevEnd = endOfMonth(prevStart);
      const bs = staff.filter((s) => s.branchId === b);
      const prim = bs.reduce((sum, s) => {
        const rev = appointments
          .filter((a) => a.staffId === s.id && a.status === "completed" && a.date >= prevStart && a.date <= prevEnd)
          .reduce((x, a) => x + a.price, 0);
        return sum + (rev * s.commissionRate) / 100;
      }, 0);
      const salary = bs.reduce((x, s) => x + s.salary, 0);
      tx({ branchId: b, type: "expense", category: "Maaş & Prim", amount: Math.round(salary + prim), date: addDays(ms, 4), note: `${bs.length} personel maaş + prim`, payment: "havale" });
      tx({ branchId: b, type: "expense", category: "Pazarlama", amount: b === "b1" ? 7500 : 6000, date: addDays(ms, 9), note: "Instagram reklamları", payment: "kart" });
      tx({ branchId: b, type: "expense", category: "Fatura", amount: 7000 + Math.round(rnd() * 5000), date: addDays(ms, 14), note: "Elektrik, su, doğalgaz, internet", payment: "havale" });
      tx({ branchId: b, type: "expense", category: "Vergi & Muhasebe", amount: 6000, date: addDays(ms, 19), note: "Muhasebe ücreti", payment: "havale" });
      for (let w = 0; w < 4; w++) {
        tx({ branchId: b, type: "expense", category: "Malzeme", amount: 6000 + Math.round(rnd() * 6000), date: addDays(ms, 2 + w * 7), note: pick(["Kalıcı oje ve jel siparişi", "Tek kullanımlık sarf malzeme", "Freze uçları ve törpüler", "Nail art süslemeleri"]), payment: "kart" });
        for (let k = 0; k < 2; k++) {
          tx({ branchId: b, type: "income", category: "Ürün Satışı", amount: 250 + Math.round(rnd() * 12) * 100, date: addDays(ms, 1 + w * 7 + Math.floor(rnd() * 6)), note: pick(["Kütikül yağı", "El kremi seti", "Tırnak bakım kiti", "Ev tipi törpü seti"]), payment: rnd() < 0.6 ? "kart" : "nakit" });
        }
      }
      if (rnd() < 0.7) tx({ branchId: b, type: "income", category: "Hediye Çeki", amount: pick([1000, 1500, 2000]), date: addDays(ms, 10 + Math.floor(rnd() * 15)), note: "Hediye çeki satışı", payment: "kart" });
    }
  }

  return {
    branches: DEFAULT_BRANCHES.map((b) => ({ ...b })),
    staff,
    services: services.map((s) => ({ ...s })),
    customers,
    appointments,
    transactions: transactions.sort((a, b) => a.date.localeCompare(b.date)),
    settings: { ...DEFAULT_SETTINGS },
  };
}

/** Gerçek kullanıma başlamak için: şubeler ve hizmet adları kalır (fiyatlar 0), diğer her şey boşalır. */
export function emptyData(): AppData {
  return {
    branches: DEFAULT_BRANCHES.map((b) => ({ ...b })),
    staff: [],
    // Fiyatlar tanıtım için uyduruldu; gerçek kullanımda işletme kendi fiyatını girer.
    services: DEFAULT_SERVICES.map((s) => ({ ...s, price: 0 })),
    customers: [],
    appointments: [],
    transactions: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}
