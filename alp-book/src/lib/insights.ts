import { addDays } from "./dates";
import { ROUTINE_BY_ID, ROUTINES, isActive } from "./routines";
import {
  comparePeriods,
  hasRecord,
  mean,
  numericSeries,
  present,
  pct,
  rangeSummary,
  routineTally,
  statusOf,
  type Entries,
} from "./stats";
import { fmtDuration, fmtHours, fmtNum } from "./time";
import type { Goals, WalkUnit } from "./types";

export interface Insight {
  id: string;
  tone: "good" | "warn" | "info";
  /** observation: kayıtlardan doğrudan okunan sayı. goal: senin belirlediğin hedefle kıyas. */
  basis: "observation" | "goal";
  title: string;
  body: string;
}

const prevOf = (dates: string[]) => dates.map((_, i) => addDays(dates[0], i - dates.length));

function avgPair(id: string, dates: string[], entries: Entries, walkUnit?: WalkUnit) {
  const r = ROUTINE_BY_ID[id];
  if (!isActive(id)) return { cur: [] as number[], prev: [] as number[], curAvg: null, prevAvg: null };
  const cur = present(numericSeries(r, dates, entries, walkUnit));
  const prev = present(numericSeries(r, prevOf(dates), entries, walkUnit));
  return { cur, prev, curAvg: mean(cur), prevAvg: mean(prev) };
}

/**
 * Yalnızca yeterli geçerli veri varsa içgörü üretir. Hepsi gözlemdir (sayı + dönem);
 * hiçbiri neden-sonuç iddia etmez.
 */
export function buildInsights(dates: string[], entries: Entries, goals: Goals, walkUnit: WalkUnit): Insight[] {
  const out: Insight[] = [];
  const n = dates.length;
  const span = `son ${n} gün`;
  const prevSpan = `önceki ${n} gün`;

  // 1) Genel tutarlılık ve eğilim
  const total = rangeSummary(dates, entries, goals);
  if (total.judged >= 8 && total.rate !== null) {
    const cmp = comparePeriods(dates, entries, goals);
    let body = `${span}: ${total.judged} değerlendirilen kayıttan ${total.done} tanesi hedefe ulaştı.`;
    let tone: Insight["tone"] = "info";
    let title = `Genel tamamlanma %${pct(total.rate)}`;
    if (cmp.delta !== null) {
      body += ` ${prevSpan} %${pct(cmp.prev as number)} idi.`;
      if (cmp.delta >= 5) {
        tone = "good";
        title += ` · ${cmp.delta} puan yükseldi`;
      } else if (cmp.delta <= -5) {
        tone = "warn";
        title += ` · ${Math.abs(cmp.delta)} puan düştü`;
      } else title += " · yatay seyrediyor";
    } else body += ` Karşılaştırma için önceki dönemde yeterli kayıt yok.`;
    out.push({ id: "overall", tone, basis: "observation", title, body });
  }

  // 2) En tutarlı ve en sık aksayan rutinler
  const tallies = ROUTINES.map((r) => ({ r, t: routineTally(r, dates, entries, goals) })).filter((x) => x.t.judged >= 4);
  if (tallies.length >= 3) {
    const sorted = [...tallies].sort((a, b) => (b.t.rate as number) - (a.t.rate as number) || b.t.judged - a.t.judged);
    const top = sorted.slice(0, 2).filter((x) => (x.t.rate as number) > 0);
    if (top.length)
      out.push({
        id: "best",
        tone: "good",
        basis: "observation",
        title: "En yüksek tamamlanma",
        body: top.map((x) => `${x.r.emoji} ${x.r.label} %${pct(x.t.rate as number)} (${x.t.done}/${x.t.judged} gün)`).join(" · "),
      });
    const worst = [...tallies]
      .filter((x) => x.t.missed >= 2)
      .sort((a, b) => (a.t.rate as number) - (b.t.rate as number) || b.t.missed - a.t.missed)
      .slice(0, 2);
    if (worst.length)
      out.push({
        id: "worst",
        tone: "warn",
        basis: "observation",
        title: "En sık aksayan",
        body: worst.map((x) => `${x.r.emoji} ${x.r.label} %${pct(x.t.rate as number)} (${x.t.missed}/${x.t.judged} gün hedef dışı)`).join(" · "),
      });
  }

  // 3) Uyku
  {
    const { cur, prev, curAvg, prevAvg } = avgPair("uyku_sure", dates, entries);
    if (curAvg !== null && cur.length >= 3) {
      const meets = cur.filter((h) => h >= goals.sleepHours).length;
      let body = `${cur.length} günlük kayıttan ortalama ${fmtDuration(curAvg * 60)}; ${meets} günde ${goals.sleepHours} saat hedefine ulaşıldı.`;
      let tone: Insight["tone"] = "info";
      if (prevAvg !== null && prev.length >= 3) {
        const d = curAvg - prevAvg;
        body += ` ${prevSpan} ortalaması ${fmtDuration(prevAvg * 60)}.`;
        if (Math.abs(d) >= 0.25) tone = d > 0 ? "good" : "warn";
      }
      out.push({ id: "sleep", tone, basis: "goal", title: `Kayıtlı uyku ortalaması ${fmtHours(curAvg)}`, body });
    }
  }

  // 3b) Gün içi uyku (hedefsiz, yalnızca gözlem)
  {
    const { cur, curAvg } = avgPair("uyku_gunici", dates, entries);
    if (curAvg !== null && cur.length >= 3) {
      const napDays = cur.filter((h) => h > 0);
      out.push({
        id: "nap",
        tone: "info",
        basis: "observation",
        title: `Gün içi uyku ${napDays.length}/${cur.length} gün`,
        body: napDays.length
          ? `Kayıt girdiğin ${cur.length} günün ${napDays.length} gününde gün içinde uyudun; uyuduğun günlerde ortalama ${fmtDuration((mean(napDays) as number) * 60)}.`
          : `Kayıt girdiğin ${cur.length} günde gün içi uyku olmadı.`,
      });
    }
  }

  // 4) Ekran süresi
  {
    const { cur, prev, curAvg, prevAvg } = avgPair("ekran", dates, entries);
    if (curAvg !== null && cur.length >= 3) {
      let body = `${cur.length} günlük kayıttan günlük ortalama ${fmtDuration(curAvg * 60)}; ${cur.filter((h) => h <= goals.screenMaxHours).length} günde ${goals.screenMaxHours} saat sınırının altında kalındı.`;
      let tone: Insight["tone"] = "info";
      let title = `Ekran süresi ortalama ${fmtHours(curAvg)}`;
      if (prevAvg !== null && prev.length >= 3) {
        const d = curAvg - prevAvg;
        if (Math.abs(d) >= 0.25) {
          tone = d < 0 ? "good" : "warn";
          title += d < 0 ? " · azalıyor" : " · artıyor";
        } else title += " · yatay";
        body += ` ${prevSpan} ortalaması ${fmtDuration(prevAvg * 60)}.`;
      }
      out.push({ id: "screen", tone, basis: "goal", title, body });
    }
  }

  // 5) Kodlama ve ders çalışma kayıtları
  for (const id of ["yazilim", "egitim"] as const) {
    const r = ROUTINE_BY_ID[id];
    if (!isActive(id)) continue;
    const t = routineTally(r, dates, entries, goals);
    if (t.judged >= 4) {
      const mins = present(numericSeries(r, dates, entries));
      let body = `Kayıt girdiğin ${t.judged} gün içinde ${t.done} gün yaptın (%${pct(t.rate as number)}).`;
      if (mins.length >= 2) body += ` Süre girilen ${mins.length} günde toplam ${fmtDuration(mins.reduce((a, b) => a + b, 0))}, günlük ortalama ${fmtDuration(mean(mins) as number)}.`;
      out.push({
        id,
        tone: (t.rate as number) >= 0.6 ? "good" : "info",
        basis: "observation",
        title: `${r.emoji} ${r.label}: ${t.done}/${t.judged} gün`,
        body,
      });
    }
  }

  // 6) Yürüyüş
  {
    const units: WalkUnit[] = [walkUnit, walkUnit === "steps" ? "min" : "steps"];
    for (const u of units) {
      const { cur, prev, curAvg, prevAvg } = avgPair("yuruyus", dates, entries, u);
      if (curAvg !== null && cur.length >= 3) {
        const label = u === "steps" ? "adım" : "dk";
        let body = `${cur.length} günlük kayıttan günlük ortalama ${fmtNum(curAvg)} ${label} (en yüksek ${fmtNum(Math.max(...cur))}).`;
        let tone: Insight["tone"] = "info";
        if (prevAvg !== null && prev.length >= 3 && prevAvg > 0) {
          const ch = Math.round(((curAvg - prevAvg) / prevAvg) * 100);
          body += ` ${prevSpan} ortalamasına göre ${ch >= 0 ? "+" : ""}${ch}%.`;
          if (Math.abs(ch) >= 10) tone = ch > 0 ? "good" : "warn";
        }
        out.push({ id: `walk-${u}`, tone, basis: "observation", title: `Yürüyüş ortalama ${fmtNum(curAvg)} ${label}`, body });
        break;
      }
    }
  }

  // 7) Su
  {
    const { cur, curAvg } = avgPair("su", dates, entries);
    if (curAvg !== null && cur.length >= 3) {
      const meets = cur.filter((v) => v >= goals.waterGlasses).length;
      out.push({
        id: "water",
        tone: meets / cur.length >= 0.6 ? "good" : "info",
        basis: "goal",
        title: `Günlük ortalama ${fmtNum(curAvg, 1)} bardak su`,
        body: `${cur.length} günlük kayıttan ${meets} günde ${goals.waterGlasses} bardak hedefine ulaşıldı.`,
      });
    }
  }

  // 8) Öğün kaydı
  {
    const days = dates.filter((d) => hasRecord(entries[d]));
    if (days.length >= 4 && isActive("beslenme")) {
      const withMeals = days.filter((d) => statusOf(ROUTINE_BY_ID.beslenme, entries[d], goals) === "done").length;
      out.push({
        id: "meals",
        tone: "info",
        basis: "observation",
        title: `Öğün kaydı ${withMeals}/${days.length} gün`,
        body: `Herhangi bir kayıt girdiğin ${days.length} gün içinde ${withMeals} gün ne yediğini de yazdın.`,
      });
    }
  }

  // 9) Eksik bilgi
  {
    const days = dates.filter((d) => hasRecord(entries[d]));
    if (days.length >= 3) {
      const miss = ROUTINES.map((r) => ({ r, c: days.filter((d) => statusOf(r, entries[d], goals) === "unrecorded").length }))
        .filter((x) => x.c / days.length >= 0.4)
        .sort((a, b) => b.c - a.c)
        .slice(0, 3);
      if (miss.length)
        out.push({
          id: "missing",
          tone: "info",
          basis: "observation",
          title: "Sık boş bırakılan alanlar",
          body: `${miss.map((x) => `${x.r.label} (${x.c}/${days.length} gün boş)`).join(", ")}. Boş alanlar yüzdeye başarısızlık olarak katılmaz; ancak analizleri zayıflatır.`,
        });
    }
  }

  return out;
}

