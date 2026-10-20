// Saf mantık testleri: npm test  (lib'i geçici olarak CommonJS'e derler, Node assert ile çalıştırır)
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";

const out = mkdtempSync(join(tmpdir(), "alpbook-test-"));
execSync(
  `npx tsc src/lib/time.ts src/lib/dates.ts src/lib/stats.ts src/lib/normalize.ts src/lib/insights.ts src/lib/routines.ts src/lib/types.ts src/lib/plans.ts src/lib/merge.ts --outDir ${out} --module esnext --target es2022 --moduleResolution bundler --skipLibCheck --strict --ignoreConfig --types node`,
  { stdio: "inherit" },
);
// Göreli import'lara .js ekle (Node ESM için) ve modülleri yükle.
writeFileSync(join(out, "package.json"), '{"type":"module"}');
for (const f of readdirSync(out).filter((x) => x.endsWith(".js"))) {
  const p = join(out, f);
  writeFileSync(p, readFileSync(p, "utf8").replace(/from "(\.\/[^"]+)";/g, 'from "$1.js";'));
}
const load = (m) => import(join(out, m + ".js"));
const { sleepMinutes, parseTime, fmtDuration } = await load("time");
const S = await load("stats");
const { normalizeData, migrateV1, emptyData } = await load("normalize");
const { buildInsights } = await load("insights");
const D = await load("dates");
const { DEFAULT_GOALS, ROUTINES } = await load("routines");

let n = 0;
const t = (name, fn) => { fn(); n++; console.log("  ✓", name); };

console.log("Uyku süresi");
t("gece yarısını geçen: 23:30 → 07:15 = 7 sa 45 dk", () => assert.equal(sleepMinutes("23:30", "07:15"), 465));
t("gece yarısından sonra yatış: 01:00 → 08:00 = 7 sa", () => assert.equal(sleepMinutes("01:00", "08:00"), 420));
t("aynı gün içinde: 13:00 → 15:30 = 2,5 sa", () => assert.equal(sleepMinutes("13:00", "15:30"), 150));
t("00:00 → 07:00", () => assert.equal(sleepMinutes("00:00", "07:00"), 420));
t("22:00 → 00:00 = 2 sa", () => assert.equal(sleepMinutes("22:00", "00:00"), 120));
t("eksik saat → null (uydurma yok)", () => { assert.equal(sleepMinutes(undefined, "07:00"), null); assert.equal(sleepMinutes("23:00", ""), null); });
t("aynı saat → null", () => assert.equal(sleepMinutes("07:00", "07:00"), null));
t("geçersiz saat → null", () => { assert.equal(parseTime("25:00"), null); assert.equal(parseTime("12:60"), null); assert.equal(parseTime("abc"), null); });
t("biçim", () => { assert.equal(fmtDuration(465), "7 sa 45 dk"); assert.equal(fmtDuration(420), "7 sa"); assert.equal(fmtDuration(45), "45 dk"); });

console.log("Durum ve yüzde kuralları");
const R = Object.fromEntries(ROUTINES.map((r) => [r.id, r]));
const G = DEFAULT_GOALS;
t("kayıt yok → unrecorded (başarısızlık sayılmaz)", () => assert.equal(S.statusOf(R.yazilim, undefined, G), "unrecorded"));
t("yesno true/false", () => { assert.equal(S.statusOf(R.okul_gitti, { okul_gitti: true }, G), "done"); assert.equal(S.statusOf(R.okul_gitti, { okul_gitti: false }, G), "missed"); });
t("yesno_min süreli evet", () => assert.equal(S.statusOf(R.yazilim, { yazilim: { done: true, minutes: 90 } }, G), "done"));
t("su 0 kaydedilmişse missed; 8 → done; kayıt yoksa unrecorded", () => {
  assert.equal(S.statusOf(R.su, { su: 0 }, G), "missed");
  assert.equal(S.statusOf(R.su, { su: 8 }, G), "done");
  assert.equal(S.statusOf(R.su, {}, G), "unrecorded");
});
t("uyku türetilir ve hedefe göre değerlendirilir", () => {
  assert.equal(S.statusOf(R.uyku_sure, { uyku_yatis: "23:30", uyku_kalkis: "07:15" }, G), "done");
  assert.equal(S.statusOf(R.uyku_sure, { uyku_yatis: "03:00", uyku_kalkis: "07:00" }, G), "missed");
  assert.equal(S.statusOf(R.uyku_sure, { uyku_yatis: "23:30" }, G), "unrecorded");
});
t("ekran: sınır altı done, üstü missed", () => { assert.equal(S.statusOf(R.ekran, { ekran: 180 }, G), "done"); assert.equal(S.statusOf(R.ekran, { ekran: 300 }, G), "missed"); });
t("yürüyüş birimine göre hedef", () => {
  assert.equal(S.statusOf(R.yuruyus, { yuruyus: { unit: "steps", value: 7000 } }, G), "done");
  assert.equal(S.statusOf(R.yuruyus, { yuruyus: { unit: "min", value: 10 } }, G), "missed");
});
t("öğün: boş öğün kayıt sayılmaz", () => {
  assert.equal(S.statusOf(R.beslenme, { beslenme: [{ id: "a", type: "Kahvaltı", items: "  " }] }, G), "unrecorded");
  assert.equal(S.statusOf(R.beslenme, { beslenme: [{ id: "a", type: "Kahvaltı", items: "yumurta" }] }, G), "done");
});
t("gün yüzdesi: kaydedilmeyenler paydaya girmez", () => {
  const s = S.daySummary({ yazilim: true, egitim: false, okul_gitti: true, uyku_yatis: "23:00" }, G);
  assert.equal(s.done, 2); assert.equal(s.missed, 1); assert.equal(s.recorded, 1); assert.equal(s.unrecorded, ROUTINES.length - 4);
  assert.equal(Math.round(s.rate * 100), 67);
});
t("hiç kayıt yoksa yüzde null", () => assert.equal(S.daySummary(undefined, G).rate, null));

console.log("Tarihler");
t("haftanın ilk günü Pazartesi", () => assert.equal(D.weekStart("2026-10-19"), "2026-10-19") && 0 || assert.equal(D.weekStart("2026-10-25"), "2026-10-19"));
t("ay ekleme gün taşması", () => assert.equal(D.addMonths("2026-01-31", 1), "2026-02-28"));
t("geçersiz tarih", () => { assert.equal(D.isValidKey("2026-02-30"), false); assert.equal(D.isValidKey("2026-10-19"), true); });

console.log("Seriler ve karşılaştırma");
const entries = {};
const days = D.lastNDays(20, "2026-10-19");
days.forEach((d, i) => { entries[d] = { yazilim: i % 2 === 0, okul_gitti: true, su: i < 10 ? 4 : 9, ekran: i < 10 ? 360 : 150, uyku_yatis: "23:30", uyku_kalkis: i < 10 ? "05:30" : "07:30" }; });
t("günlük yüzde serisi null'ları korur", () => { const s = S.dailyRateSeries(["2026-01-01", days[0]], entries, G); assert.equal(s[0], null); assert.notEqual(s[1], null); });
t("dönem karşılaştırma: son 10 gün öncekinden iyi", () => { const c = S.comparePeriods(days.slice(10), entries, G); assert.ok(c.delta > 0, String(c.delta)); });
t("yetersiz veride delta null", () => assert.equal(S.comparePeriods(["2026-10-19"], { "2026-10-19": { yazilim: true } }, G).delta, null));
t("su serisi: kayıtsız gün null (0 değil)", () => assert.equal(S.numericSeries(R.su, ["2026-01-01"], entries)[0], null));
t("haftalık/aylık çubuklar", () => { assert.equal(S.weeklyBars("2026-10-19", 4, entries, G).length, 4); assert.equal(S.monthlyBars("2026-10-19", 3, entries, G).length, 3); });
t("kategori en güçlü/zayıf yalnızca yeterli veriyle", () => { assert.equal(S.strongestWeakest(S.groupStats(["2026-10-19"], { "2026-10-19": { yazilim: true, egitim: false } }, G)), null); assert.ok(S.strongestWeakest(S.groupStats(days, entries, G))); });
t("kayıt serisi", () => assert.equal(S.recordStreak(entries, "2026-10-19"), 20));

console.log("Gözlemler");
t("yeterli veriyle gözlem üretir, veri yoksa üretmez", () => {
  const ins = buildInsights(days.slice(10), entries, G, "steps");
  assert.ok(ins.some((i) => i.id === "overall") && ins.some((i) => i.id === "sleep") && ins.some((i) => i.id === "screen"));
  assert.equal(buildInsights(["2026-10-19"], {}, G, "steps").length, 0);
});
t("ekran süresi azalışı iyi diye işaretlenir", () => assert.equal(buildInsights(days.slice(10), entries, G, "steps").find((i) => i.id === "screen").tone, "good"));

console.log("Normalizasyon ve geçiş");
t("geçersiz değerler atılır ve sayılır", () => {
  const r = normalizeData({ entries: { "2026-10-19": { su: 999, yazilim: true, uyku_yatis: "25:00", bilinmeyen: 1 }, kotu: {} } });
  assert.equal(r.data.entries["2026-10-19"].yazilim, true);
  assert.equal(r.data.entries["2026-10-19"].su, undefined);
  assert.ok(r.dropped >= 3);
});
t("saat 9:05 → 09:05 normalize", () => assert.equal(normalizeData({ entries: { "2026-10-19": { uyku_yatis: "9:05" } } }).data.entries["2026-10-19"].uyku_yatis, "09:05"));
t("yedek sarmalayıcısı açılır", () => assert.equal(normalizeData({ app: "alp-book", data: { ...emptyData(), entries: { "2026-10-19": { su: 5 } } } }).data.entries["2026-10-19"].su, 5));
t("v1 verisi taşınır, ham kayıt korunur", () => {
  const v1 = { profile: { name: "Ali", onboarded: true }, habits: [{ id: "code" }, { id: "teeth" }], logs: { "2026-10-18": { v: { code: true, teeth: false }, meal: "makarna" } }, courses: [], exams: [] };
  const m = migrateV1(v1);
  assert.equal(m.entries["2026-10-18"].yazilim, true);
  assert.equal(m.entries["2026-10-18"].beslenme[0].items, "makarna");
  assert.equal(m.profile.name, "Ali");
  assert.deepEqual(m.legacy.logs, v1.logs);
});
t("bozuk giriş null döner", () => { assert.equal(normalizeData(null), null); assert.equal(normalizeData({ foo: 1 }), null); });

console.log("Planlar");
const { sortPlans, plansByDate } = await load("plans");
t("planlar saate göre sıralanır, saatsizler sona", () => {
  const r = sortPlans([{ id: "a", date: "2026-10-20", title: "x", done: false }, { id: "b", date: "2026-10-20", title: "y", time: "14:00", done: false }, { id: "c", date: "2026-10-20", title: "z", time: "09:30", done: false }]);
  assert.deepEqual(r.map((p) => p.id), ["c", "b", "a"]);
});
t("plansByDate günlere ayırır", () => assert.equal(plansByDate([{ id: "a", date: "2026-10-20", title: "x", done: false }, { id: "b", date: "2026-10-21", title: "y", done: true }]).size, 2));
t("normalize: geçersiz plan atılır, saat düzeltilir, ses tercihi korunur", () => {
  const r = normalizeData({ profile: { soundOn: false, volume: 0.3 }, entries: {}, plans: [{ id: "1", date: "2026-10-20", title: "  Toplantı ", time: "9:05", done: true }, { id: "2", date: "kötü", title: "x" }, { id: "3", date: "2026-10-20", title: "  " }] });
  assert.equal(r.data.plans.length, 1);
  assert.equal(r.data.plans[0].time, "09:05"); assert.equal(r.data.plans[0].title, "Toplantı"); assert.equal(r.data.plans[0].done, true);
  assert.equal(r.data.profile.soundOn, false); assert.equal(r.data.profile.volume, 0.3);
});
t("normalize: eski veride ses varsayılanı açık", () => assert.equal(normalizeData({ entries: {} }).data.profile.soundOn, true));
t("takvim ızgarası tam haftalardan oluşur ve Pazartesi başlar", () => {
  const g = D.monthGrid("2026-10-15");
  assert.equal(g.length % 7, 0); assert.equal(g[0], "2026-09-28"); assert.equal(g[g.length - 1], "2026-11-01");
});

console.log("Bulut birleştirme");
const M = await load("merge");
const base = () => emptyData();
t("birleştirme hiçbir kaydı silmez, çakışmada yerel kazanır", () => {
  const cloud = { ...base(), entries: { "2026-10-01": { su: 5, yazilim: true }, "2026-10-02": { su: 7 } } };
  const local = { ...base(), profile: { ...base().profile, onboarded: true, name: "Ali" }, entries: { "2026-10-01": { su: 9 }, "2026-11-03": { egitim: true } } };
  const m = M.mergeData(cloud, local);
  assert.equal(m.entries["2026-10-01"].su, 9); assert.equal(m.entries["2026-10-01"].yazilim, true);
  assert.equal(m.entries["2026-10-02"].su, 7); assert.equal(m.entries["2026-11-03"].egitim, true);
  assert.equal(m.profile.name, "Ali");
});
t("birleştirme: yeni cihazda (yerel boş) bulut verisi gelir", () => {
  const cloud = { ...base(), profile: { ...base().profile, onboarded: true, name: "Efe" }, goals: { ...DEFAULT_GOALS, waterGlasses: 10 }, plans: [{ id: "p1", date: "2026-10-20", title: "x", done: false }], entries: { "2026-10-01": { su: 5 } } };
  const m = M.mergeData(cloud, base());
  assert.equal(m.profile.onboarded, true); assert.equal(m.profile.name, "Efe"); assert.equal(m.goals.waterGlasses, 10); assert.equal(m.plans.length, 1);
});
t("birleştirme: plan ve sınavlar id'ye göre birleşir (kopya olmaz)", () => {
  const p = (id, title) => ({ id, date: "2026-10-20", title, done: false });
  const m = M.mergeData({ ...base(), plans: [p("a", "bulut"), p("b", "b")] }, { ...base(), plans: [p("a", "yerel"), p("c", "c")] });
  assert.deepEqual(m.plans.map((x) => x.id).sort(), ["a", "b", "c"]); assert.equal(m.plans.find((x) => x.id === "a").title, "yerel");
});
t("birleştirme: cihaz tercihleri (ses) yerelde kalır", () => {
  const m = M.mergeData({ ...base(), profile: { ...base().profile, soundOn: true } }, { ...base(), profile: { ...base().profile, soundOn: false, volume: 0.2 } });
  assert.equal(m.profile.soundOn, false); assert.equal(m.profile.volume, 0.2);
});
t("aylara bölme ve meta belgesi cihaz tercihlerini içermez", () => {
  const sp = M.splitMonths({ "2026-10-01": { su: 1 }, "2026-10-02": { su: 2 }, "2026-11-01": { su: 3 } });
  assert.deepEqual(Object.keys(sp).sort(), ["2026-10", "2026-11"]); assert.equal(Object.keys(sp["2026-10"]).length, 2);
  const meta = M.toMeta(base()); assert.equal("soundOn" in meta, false); assert.equal("volume" in meta, false);
});

console.log(`\n${n} test geçti.`);
