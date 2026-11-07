// Saf mantık testleri: npm test  (lib'i geçici olarak derler, Node assert ile çalıştırır)
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "melopee-test-"));
execSync(
  `npx tsc src/lib/dates.ts src/lib/format.ts src/lib/constants.ts src/lib/types.ts src/lib/seed.ts src/lib/stats.ts src/lib/csv.ts --outDir ${out} --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --strict --ignoreConfig --types node`,
  { stdio: "inherit" },
);
writeFileSync(join(out, "package.json"), '{"type":"module"}');
for (const f of readdirSync(out).filter((x) => x.endsWith(".js"))) {
  const p = join(out, f);
  writeFileSync(p, readFileSync(p, "utf8").replace(/from "(\.\/[^"]+)";/g, 'from "$1.js";'));
}
const load = (m) => import(join(out, m + ".js"));
const D = await load("dates");
const F = await load("format");
const S = await load("stats");
const { buildDemoData, emptyData } = await load("seed");
const { toCsv } = await load("csv");

let n = 0;
const t = (name, fn) => {
  fn();
  n++;
  console.log("  ✓", name);
};

console.log("Tarihler");
t("hafta pazartesi başlar", () => {
  assert.equal(D.startOfWeek("2026-11-07"), "2026-11-02"); // cumartesi → pazartesi
  assert.equal(D.startOfWeek("2026-11-08"), "2026-11-02"); // pazar → önceki pazartesi
  assert.equal(D.startOfWeek("2026-11-02"), "2026-11-02");
});
t("ay sonu ve ay kaydırma", () => {
  assert.equal(D.endOfMonth("2026-02-10"), "2026-02-28");
  assert.equal(D.addMonths("2026-01-31", 1), "2026-02-28");
  assert.equal(D.addMonths("2026-03-15", -3), "2025-12-15");
});
t("dönemler", () => {
  const w = D.periodOf("week", "2026-11-07");
  assert.equal(w.start, "2026-11-02");
  assert.equal(w.end, "2026-11-08");
  assert.equal(D.previousPeriod(w).start, "2026-10-26");
  const m = D.periodOf("month", "2026-11-07");
  assert.equal(m.start, "2026-11-01");
  assert.equal(m.end, "2026-11-30");
  assert.equal(D.shiftPeriod(m, -1).start, "2026-10-01");
});
t("devam eden dönem önceki dönemin aynı günleriyle kıyaslanır", () => {
  const m = D.comparable(D.periodOf("month", "2026-11-07"), "2026-11-07");
  assert.deepEqual(m.cur, { start: "2026-11-01", end: "2026-11-07" });
  assert.deepEqual(m.prev, { start: "2026-10-01", end: "2026-10-07" });
  assert.equal(m.partial, true);
  const w = D.comparable(D.periodOf("week", "2026-11-07"), "2026-11-07");
  assert.deepEqual(w.prev, { start: "2026-10-26", end: "2026-10-31" });
  const past = D.comparable(D.periodOf("month", "2026-10-10"), "2026-11-07");
  assert.deepEqual(past.prev, { start: "2026-09-01", end: "2026-09-30" });
  assert.equal(past.partial, false);
  // 31 Mart'ın önceki dönemi Şubat sonunu aşmaz
  const mar = D.comparable(D.periodOf("month", "2027-03-31"), "2027-03-31");
  assert.equal(mar.prev.end, "2027-02-28");
});
t("saat dönüşümü", () => {
  assert.equal(D.timeToMin("10:30"), 630);
  assert.equal(D.minToTime(630), "10:30");
  assert.equal(D.endTime("10:30", 90), "12:00");
});

console.log("Biçimlendirme");
t("Türkçe arama normalizasyonu", () => {
  assert.equal(F.normalizeSearch("  İrem ÇELİK "), "irem celik");
  assert.equal(F.normalizeSearch("Şule Güneş"), "sule gunes");
});
t("WhatsApp bağlantısı", () => {
  assert.equal(F.whatsappLink("0500 123 45 67"), "https://wa.me/905001234567");
  assert.equal(F.whatsappLink("500 123 45 67"), "https://wa.me/905001234567");
});
t("değişim oranı", () => {
  assert.equal(F.change(120, 100), 0.2);
  assert.equal(F.change(5, 0), null);
});

console.log("Tanıtım verisi");
const today = "2026-11-07";
const data = buildDemoData(today, 15 * 60);
t("iki şube, altı personel, müşteriler ve randevular üretilir", () => {
  assert.equal(data.branches.length, 2);
  assert.equal(data.staff.length, 6);
  assert.ok(data.customers.length > 60);
  assert.ok(data.appointments.length > 1500);
});
t("aynı tohumla aynı veri", () => {
  const again = buildDemoData(today, 15 * 60);
  assert.equal(again.appointments.length, data.appointments.length);
  assert.deepEqual(again.appointments[100], data.appointments[100]);
});
t("personel randevuları çakışmaz", () => {
  for (const a of data.appointments) {
    if (!S.isBusy(a)) continue;
    const c = S.findConflict(data.appointments, a);
    assert.equal(c, null, `${a.id} ile ${c?.id} çakışıyor`);
  }
});
t("randevular şube saatleri içinde ve personelin çalıştığı günde", () => {
  for (const a of data.appointments) {
    const b = data.branches.find((x) => x.id === a.branchId);
    const s = data.staff.find((x) => x.id === a.staffId);
    assert.equal(s.branchId, a.branchId);
    assert.ok(D.timeToMin(a.start) >= b.openHour * 60);
    assert.ok(D.timeToMin(a.start) + a.durationMin <= b.closeHour * 60);
    assert.ok(s.workDays.includes(D.weekday(a.date)));
  }
});
t("bir müşteri aynı gün aynı şubede tek randevu alır", () => {
  const seen = new Set();
  for (const a of data.appointments) {
    const k = `${a.date}|${a.branchId}|${a.customerId}`;
    assert.ok(!seen.has(k), k);
    seen.add(k);
  }
});
t("geçmiş tamamlanır, gelecek planlıdır; tamamlananın ödemesi vardır", () => {
  for (const a of data.appointments) {
    if (a.date > today) assert.ok(["planned", "confirmed", "cancelled"].includes(a.status));
    if (a.status === "completed") assert.ok(a.payment);
    else assert.equal(a.payment, null);
  }
});
t("gelecek tarihli gider kaydı yok", () => {
  assert.ok(data.transactions.every((x) => x.date <= today));
});
t("boş başlangıç şubeleri ve hizmetleri korur", () => {
  const e = emptyData();
  assert.equal(e.branches.length, 2);
  assert.ok(e.services.length > 5);
  assert.equal(e.appointments.length, 0);
});

console.log("İstatistikler");
const month = D.periodOf("month", "2026-10-15");
t("özet: gelir = hizmet + diğer, net = gelir − gider", () => {
  const s = S.summarize(data, month.start, month.end, "all");
  assert.ok(s.serviceRevenue > 0 && s.expense > 0);
  assert.equal(s.income, s.serviceRevenue + s.otherIncome);
  assert.equal(s.net, s.income - s.expense);
  assert.ok(s.occupancy > 0.3 && s.occupancy <= 1, `doluluk ${s.occupancy}`);
});
t("şubeler toplamı = tüm şubeler", () => {
  const all = S.summarize(data, month.start, month.end, "all");
  const parts = S.byBranch(data, month.start, month.end);
  assert.equal(parts.reduce((x, p) => x + p.income, 0), all.income);
  assert.equal(parts.reduce((x, p) => x + p.expense, 0), all.expense);
  assert.equal(parts.reduce((x, p) => x + p.appointments, 0), all.appointments);
});
t("personel cirosu toplamı = hizmet cirosu", () => {
  const all = S.summarize(data, month.start, month.end, "b1");
  const perf = S.byStaff(data, month.start, month.end, "b1");
  assert.equal(perf.reduce((x, p) => x + p.revenue, 0), all.serviceRevenue);
  for (const p of perf) assert.equal(p.commission, (p.revenue * p.staff.commissionRate) / 100);
});
t("hizmet kırılımı toplamı = hizmet cirosu", () => {
  const all = S.summarize(data, month.start, month.end, "all");
  const rows = S.byService(data, month.start, month.end, "all");
  assert.equal(rows.reduce((x, r) => x + r.value, 0), all.serviceRevenue);
});
t("ödeme kırılımı toplamı = toplam gelir", () => {
  const all = S.summarize(data, month.start, month.end, "all");
  const pm = S.byPayment(data, month.start, month.end, "all");
  assert.equal(pm.nakit + pm.kart + pm.havale, all.income);
});
t("aylık dilimler gün sayısı kadar, toplamları özetle eşit", () => {
  const b = S.buckets(data, month, "all");
  const all = S.summarize(data, month.start, month.end, "all");
  assert.equal(b.length, 31);
  assert.equal(b.reduce((x, k) => x + k.income, 0), all.income);
  assert.equal(b.reduce((x, k) => x + k.expense, 0), all.expense);
});
t("günlük dilimler saat saat", () => {
  const b = S.buckets(data, D.periodOf("day", "2026-10-15"), "b1");
  assert.equal(b[0].label, "10:00");
  assert.equal(b.length, 10);
});
t("çakışma tespiti", () => {
  const appts = [{ id: "x", staffId: "p1", date: today, start: "10:00", durationMin: 60, status: "confirmed" }];
  assert.ok(S.findConflict(appts, { id: "y", staffId: "p1", date: today, start: "10:30", durationMin: 30 }));
  assert.equal(S.findConflict(appts, { id: "y", staffId: "p1", date: today, start: "11:00", durationMin: 30 }), null);
  assert.equal(S.findConflict(appts, { id: "y", staffId: "p2", date: today, start: "10:30", durationMin: 30 }), null);
  assert.equal(S.findConflict([{ ...appts[0], status: "cancelled" }], { id: "y", staffId: "p1", date: today, start: "10:30", durationMin: 30 }), null);
});
t("geri kazanım ve doğum günü listeleri", () => {
  const stats = S.customerStats(data.appointments, today);
  const lapsed = S.lapsedCustomers(data.customers, stats, today);
  assert.ok(lapsed.length > 0);
  for (const { s } of lapsed) assert.ok(D.diffDays(s.lastVisit, today) >= 45 && !s.nextVisit);
  const bd = S.upcomingBirthdays([{ id: "c", birthday: "11-09" }], today, 7);
  assert.equal(bd.length, 1);
  assert.equal(bd[0].inDays, 2);
});

console.log("CSV");
t("noktalı virgül ayraç, tırnak kaçışı ve BOM", () => {
  const csv = toCsv(["Ad", "Not"], [["Ayşe", 'Dedi ki "merhaba"; sonra gitti']]);
  assert.ok(csv.startsWith("﻿"));
  assert.ok(csv.includes('"Dedi ki ""merhaba""; sonra gitti"'));
});

console.log(`\n${n} test geçti.`);
