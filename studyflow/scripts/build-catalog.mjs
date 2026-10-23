// Resmî MEB ders kitabı kaydından src/data/catalog.json üretir.
//
// Önkoşullar:  node scripts/fetch-textbooks.mjs   (kitap listesi, kapak/PDF doğrulaması)
//              PDF_DIR=<klasör>  içinde  <kitapId>.pdf  dosyaları  (poppler: pdftotext, pdfinfo)
// Kullanım:    PDF_DIR=... node scripts/build-catalog.mjs
//
// Telif notu: MEB kitaplarının metni, soruları ve şekilleri yeniden yayımlanamaz. Bu betik yalnızca
// başlık ve sayfa numarası gibi olgusal dizin bilgisini kaydeder; kitap metnini depoya yazmaz.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { findTocPages, tocEntries, buildUnits, assignRanges } from "./lib/toc.mjs";

const ORIGIN = "https://tymm.meb.gov.tr";
const PDF_DIR = process.env.PDF_DIR || "scripts/.cache/pdf";
const raw = JSON.parse(readFileSync("scripts/.cache/books.raw.json", "utf8"));
const overrides = existsSync("scripts/toc-overrides.json") ? JSON.parse(readFileSync("scripts/toc-overrides.json", "utf8")) : {};

const SUBJECTS = [
  ["matematik", /^matematik/i],
  ["fizik", /^fizik/i],
  ["kimya", /^kimya/i],
  ["biyoloji", /^biyoloji/i],
  ["turk-dili-ve-edebiyati", /^türk dili/i],
  ["tarih", /^tarih/i],
  ["cografya", /^coğrafya/i],
  ["felsefe", /^felsefe/i],
  ["ingilizce", /^ingilizce|^İngilizce/i],
  ["din-kulturu", /^din kültürü/i],
  ["arapca", /^arapça/i],
  ["kuran", /^kur.an/i],
  ["fikih", /^fıkıh/i],
  ["hadis", /^hadis/i],
  ["siyer", /^siyer/i],
  ["peygamberimizin-hayati", /^peygamberimizin/i],
  ["temel-dini-bilgiler", /^temel din/i],
];
const subjectOf = (title) => SUBJECTS.find(([, re]) => re.test(title))?.[0] ?? null;

const KEEP = new Set(["DNA", "RNA", "ATP", "ADP", "NADH", "TYT", "AYT", "MEB", "TBMM", "UV", "CO2", "AİHL", "TDE", "EBA", "LGS", "ABD", "BM", "AB"]);
/** "GERÇEK SAYILARIN ÜSLÜ" → "Gerçek sayıların üslü"; zaten karışık harfli başlıklara dokunmaz. */
function nice(input) {
  const t = input.replace(/\s+/g, " ").replace(/^[\s.:–-]+|[\s.:–-]+$/g, "");
  const letters = t.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü]/g, "");
  const upper = letters.replace(/[^A-ZÇĞİÖŞÜ]/g, "").length;
  if (!letters || upper / letters.length < 0.6) return t;
  const lower = t
    .split(" ")
    .map((w) => (KEEP.has(w) ? w : w === "PH" ? "pH" : w.toLocaleLowerCase("tr-TR")))
    .join(" ");
  return lower.charAt(0).toLocaleUpperCase("tr-TR") + lower.slice(1);
}

/** Elle girilen içindekiler (iki sütunlu / düzensiz düzenler): her satır sayfa numarasıyla gelir.
 *   U <no> <tema|unite> | Başlık | sayfa | [ölçme sayfası]
 *   T <no> | Başlık | sayfa
 *   S <no> | Başlık | sayfa
 */
function parseDsl(text) {
  const units = [];
  for (const line of text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"))) {
    const [head, ...rest] = line.split("|").map((x) => x.trim());
    const [kind, ...hp] = head.split(/\s+/);
    if (kind === "U") {
      units.push({ no: Number(hp[0]), kind: hp[1] || "tema", title: rest[0], page: Number(rest[1]), evalPage: rest[2] ? Number(rest[2]) : undefined, topics: [] });
    } else if (kind === "T") {
      units.at(-1).topics.push({ no: hp[0], title: rest[0], page: Number(rest[1]), probe: rest[2] || undefined, probePage: rest[3] ? Number(rest[3]) : undefined, sections: [] });
    } else if (kind === "S") {
      units.at(-1).topics.at(-1).sections.push({ no: hp[0], title: rest[0], page: Number(rest[1]) });
    }
  }
  return units;
}

function pageTexts(pdf, pages) {
  const out = execFileSync("pdftotext", ["-f", "1", "-l", String(pages), "-layout", pdf, "-"], { maxBuffer: 1 << 29, stdio: ["ignore", "pipe", "ignore"] }).toString("utf8");
  return out.split("\f");
}
const fold = (s) =>
  s
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİ]/g, "i")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .trim();

/** Basılı sayfa → fiziksel sayfa farkını başlıkların gerçekten bulunduğu sayfalardan bulur. */
function findOffset(texts, probes) {
  const votes = new Map();
  let tested = 0;
  for (const { title, page } of probes) {
    const key = fold(title).split(" ").slice(0, 4).join(" ");
    if (key.length < 8) continue;
    tested++;
    let hit = false;
    for (let off = 0; off <= 30; off++) {
      const t = texts[page + off - 1];
      if (t && fold(t).includes(key)) {
        votes.set(off, (votes.get(off) || 0) + 1);
        hit = true;
        break;
      }
    }
    if (!hit && process.env.DEBUG_BOOK) console.log(`   bulunamadı: "${key}" (sayfa ${page})`);
  }
  const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  return best ? { offset: best[0], agree: best[1], tested } : { offset: null, agree: 0, tested };
}

const books = [];
const report = [];
for (const b of raw.books) {
  if (/Öğretmen Kılavuz/i.test(b.title)) continue;
  if (process.env.ONLY && !process.env.ONLY.split(",").includes(String(b.id))) continue;
  const isWorkbook = /Çalışma Kitabı/i.test(b.title);
  const subjectId = subjectOf(b.title);
  if (!subjectId) {
    report.push(`ATLANDI (ders tanınmadı): ${b.id} ${b.title}`);
    continue;
  }
  const grade = b.grades[0];
  const vol = b.title.match(/\((\d)\.Kitap\)/)?.[1] ?? null;
  const stamp = b.pdfUrl?.match(/_(\d{8})_(\d{6})_\d+\.pdf$/);
  const book = {
    id: b.id,
    title: b.title.replace(/\s+/g, " ").trim(),
    subjectId,
    grade,
    kind: isWorkbook ? "calisma" : "ders",
    volume: vol ? `${vol}. Kitap` : null,
    programLabel: b.programLabel ?? null,
    kademe: b.kademeId === 6 ? "aihl" : "ortaogretim",
    publisher: "T.C. Millî Eğitim Bakanlığı",
    updatedOn: b.updatedOn ?? null,
    fileStamp: stamp ? `${stamp[1].slice(0, 4)}-${stamp[1].slice(4, 6)}-${stamp[1].slice(6, 8)}` : null,
    detailUrl: ORIGIN + b.detailPath,
    pdfUrl: ORIGIN + b.pdfUrl,
    coverUrl: ORIGIN + b.imageUrl,
    pdfVerified: !!b.pdfCheck?.ok && /pdf/i.test(b.pdfCheck.type || ""),
    coverVerified: !!b.coverCheck?.ok && /image/i.test(b.coverCheck.type || ""),
    pdfBytes: b.pdfCheck?.length || 0,
    pageCount: 0,
    pageOffset: null,
    tocVerified: false,
    units: [],
  };
  const pdf = join(PDF_DIR, `${b.id}.pdf`);
  if (!isWorkbook && existsSync(pdf)) {
    try {
      const info = execFileSync("pdfinfo", [pdf], { stdio: ["ignore", "pipe", "ignore"] }).toString();
      book.pageCount = Number(info.match(/Pages:\s+(\d+)/)?.[1] ?? 0);
      const texts = pageTexts(pdf, book.pageCount);
      let units;
      let issues = [];
      if (overrides[b.id]) {
        units = parseDsl(overrides[b.id].toc);
        assignRanges(units, overrides[b.id].lastPage ?? book.pageCount);
        issues.push("içindekiler elle girildi (sayfalar gövdede doğrulanır)");
      } else if (overrides[b.id] === null) {
        // bilerek atlanır
      } else {
        const tocPages = findTocPages(texts);
        if (tocPages.length === 0) {
          report.push(`İÇİNDEKİLER BULUNAMADI: ${b.id} ${book.title}`);
        } else {
          const lines = tocPages.flatMap((p) => texts[p].split("\n"));
          const entries = tocEntries(lines);
          const built = buildUnits(entries);
          units = assignRanges(built.units, book.pageCount);
          issues = built.issues;
        }
      }
      if (units?.length) {
        const probes = units.flatMap((u) => [
          { title: u.title, page: u.page },
          ...u.topics.map((t) => ({ title: t.probe ?? t.title, page: t.probePage ?? t.page })),
        ]);
        const off = findOffset(texts, probes);
        book.pageOffset = off.offset;
        const topicCount = units.reduce((n, u) => n + u.topics.length, 0);
        // Doğrulama: başlıkların çoğu gerçekten öngörülen sayfada bulunmalı
        book.tocVerified = off.offset !== null && off.agree >= Math.max(3, Math.floor(off.tested * 0.6));
        book.units = units.map((u) => ({
          id: `b${b.id}-u${u.no}`,
          no: u.no,
          kind: u.kind,
          title: nice(u.title),
          page: u.page,
          endPage: u.endPage,
          topics: u.topics.map((t) => ({
            id: `b${b.id}-t${t.no}`,
            no: t.no,
            title: nice(t.title),
            page: t.page,
            endPage: t.endPage,
            sections: (t.sections || []).map((x) => ({ id: `b${b.id}-t${x.no}`, no: x.no, title: nice(x.title), page: x.page, endPage: x.endPage ?? t.endPage })),
          })),
        }));
        report.push(
          `${book.tocVerified ? "TAMAM " : "ŞÜPHELİ"} ${b.id} ${book.title}: ${units.length} ünite, ${topicCount} konu, ofset=${off.offset} (${off.agree}/${off.tested}) ${issues.join("; ")}`,
        );
      }
    } catch (e) {
      report.push(`HATA ${b.id} ${book.title}: ${e.message.split("\n")[0]}`);
    }
  } else if (!isWorkbook) {
    report.push(`PDF YOK: ${b.id} ${book.title}`);
  }
  books.push(book);
}

mkdirSync("src/data", { recursive: true });
writeFileSync(
  "src/data/catalog.json",
  JSON.stringify({ source: ORIGIN, generatedAt: new Date().toISOString().slice(0, 10), books }, null, 1),
);
writeFileSync("scripts/.cache/catalog-report.txt", report.join("\n"));
console.log(report.join("\n"));
console.log(`\n${books.length} kitap yazıldı.`);
