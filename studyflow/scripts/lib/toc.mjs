// Ders kitabı "İçindekiler" sayfalarından ünite / konu / sayfa yapısını çıkarır.
// Giriş: pdftotext -layout çıktısı (sayfa başına). Çıkış: { units, issues }.
// Her kayıt PDF'in kendi içindekiler tablosundan gelir; sayfa numaraları ayrıca
// kitabın gövdesinde başlığın gerçekten o sayfada geçtiği kontrol edilerek doğrulanır.

const NOISE = [
  /^kitabın dijital/i,
  /^başlıklar üzerine/i,
  /^sayfalarda da/i,
  /^sayfasında başlıklar/i,
  /^sayfasına ulaşabilirsiniz/i,
  /^sayfalara ulaşabilirsiniz/i,
  /^isimleri üzerine/i,
  /^isimlerinin üzerine/i,
  /^ilgili sayfalara/i,
  /^iç sayfalarda/i,
  /^sayfasındaki başlıklar/i,
  /^sayfalarda da tema/i,
  /^“?i[çc]indekiler”?\s+sayfasına/i,
  /^sayfasına ulaşabilirsiniz/i,
  /^isimlerine tıklayarak/i,
];

const END_MARKERS = /^(sözlük|kaynakça|cevap anahtar|görsel[, ]|görsel ve|türkiye[’']nin mülki|türk dünyası haritası|formlar|dizin|ek\b)/i;
const UNIT_END = /(ölçme ve değerlendirme|tema ölçme|ünite ölçme|değerlendirme soruları)/i;

function cleanLine(raw) {
  return raw
    .replace(/[^\p{L}\p{N}\p{M}\s.,;:!?()’'“”‘"\-–/&%+=<>[\]]/gu, " ")
    .replace(/\.{2,}/g, " ")
    .replace(/[\t ]+/g, " ")
    .trim();
}

/** @param {string[]} pageTexts sayfa başına pdftotext -layout çıktısı (fiziksel 1..n) */
export function findTocPages(pageTexts, maxScan = 16) {
  let start = -1;
  for (let i = 0; i < Math.min(maxScan, pageTexts.length); i++) {
    const t = pageTexts[i];
    if (/i\s*ç\s*i\s*n\s*d\s*e\s*k\s*i\s*l\s*e\s*r/.test(t.toLocaleLowerCase("tr-TR"))) {
      const hits = (t.match(/\s\d{1,3}\s*$/gm) || []).length;
      if (hits >= 4) {
        start = i;
        break;
      }
    }
  }
  if (start < 0) return [];
  const pages = [start];
  for (let i = start + 1; i < Math.min(start + 5, pageTexts.length); i++) {
    const hits = (pageTexts[i].match(/\s\d{1,3}\s*$/gm) || []).length;
    if (hits >= 5) pages.push(i);
    else break;
  }
  return pages;
}

/** Satırları (sayfa numarası sonda) tek girdilere birleştirir. */
export function tocEntries(lines) {
  const entries = [];
  let pending = "";
  let afterNumberOnly = false; // son girdi tek başına duran bir sayfa numarasıyla kapandı
  for (const raw of lines) {
    let line = cleanLine(raw);
    if (!line) continue;
    const low = line.toLocaleLowerCase("tr-TR");
    if (/^i[çc]indekiler$/.test(low)) continue;
    if (/^(ünite|tema)$/.test(low)) continue;
    const lead = low.match(/^(?:ünite|tema)\s+(?=\d+\.\d)/);
    if (lead) line = line.slice(lead[0].length);
    if (NOISE.some((r) => r.test(line))) continue;
    // sadece sayı → bekleyen başlığın sayfası
    if (/^\d{1,3}$/.test(line)) {
      if (pending) {
        entries.push({ text: pending.trim(), page: Number(line) });
        pending = "";
        afterNumberOnly = true;
      }
      continue;
    }
    const m = line.match(/^(.*\S)\s+(\d{1,3})(?:-\d{1,3})?$/);
    if (m) {
      const text = (pending ? pending + " " : "") + m[1];
      entries.push({ text: text.trim(), page: Number(m[2]) });
      pending = "";
      afterNumberOnly = false;
    } else if (afterNumberOnly && entries.length && !/^\d+\./.test(line)) {
      // başlığın sayfa numarasından sonra gelen ikinci satırı
      entries[entries.length - 1].text += " " + line;
    } else {
      pending += (pending ? " " : "") + line;
      afterNumberOnly = false;
    }
  }
  return entries;
}

/** Girdilerden hiyerarşi kurar. Desteklenen düzen: "N. Tema|ÜNİTE Başlık", "N.M. Konu", "N.M.K Alt başlık". */
export function buildUnits(entries) {
  const units = [];
  const issues = [];
  let cur = null;
  let lastTopic = null;
  for (let idx = 0; idx < entries.length; idx++) {
    const e = entries[idx];
    const text = e.text.replace(/\s+/g, " ").trim();
    const low = text.toLocaleLowerCase("tr-TR");
    if (END_MARKERS.test(low)) {
      if (cur) cur.endMarker = Math.min(cur.endMarker ?? 1e9, e.page);
      break;
    }
    let m;
    // "1. Ünite Ölçme ve Değerlendirme Soruları 37" / "1. Ünite Sonnotlar 43" → ünite sonu işareti
    if ((m = low.match(/^(\d+)\.\s*(?:tema|ünite)\s*:?\s*(.*)$/)) && (UNIT_END.test(m[2]) || /^sonnot/.test(m[2]))) {
      const u = units.find((x) => x.no === Number(m[1]));
      if (u && UNIT_END.test(m[2])) u.evalPage = u.evalPage ?? e.page;
      continue;
    }
    if (/^sonnot/.test(low)) continue;
    // Ünite: "1. Tema SAYILAR" / "1. ÜNİTE FİZİK ..." / "Tema 1 ..."
    if ((m = low.match(/^(\d+)\.\s*(?:tema|ünite)\s*:?\s*(.*)$/))) {
      const title = text.slice(text.length - m[2].length);
      cur = { no: Number(m[1]), kind: /tema/.test(low.slice(0, 12)) ? "tema" : "unite", title: title || "", page: e.page, topics: [] };
      units.push(cur);
      lastTopic = null;
      continue;
    }
    // Konu: "1.1. Başlık"
    if ((m = text.match(/^(\d+)\.(\d+)\.?\s*(\D.+)$/)) && !/^\d+\.\d+\.\d+/.test(text)) {
      const unitNo = Number(m[1]);
      if (!cur || cur.no !== unitNo) {
        cur = units.find((u) => u.no === unitNo) || null;
        if (!cur) {
          cur = { no: unitNo, kind: "unite", title: "", page: e.page, topics: [] };
          units.push(cur);
          issues.push(`Ünite ${unitNo} başlığı bulunamadı`);
        }
      }
      lastTopic = { no: `${m[1]}.${m[2]}`, title: m[3], page: e.page, sections: [] };
      cur.topics.push(lastTopic);
      continue;
    }
    // Alt başlık: "2.3.1 Başlık"
    if ((m = text.match(/^(\d+)\.(\d+)\.(\d+)\.?\s*(\D.+)$/))) {
      if (lastTopic) lastTopic.sections.push({ no: `${m[1]}.${m[2]}.${m[3]}`, title: m[4], page: e.page });
      continue;
    }
    // Ünite ölçme: ünite sınırını işaretle
    if (UNIT_END.test(low) && cur) {
      cur.evalPage = cur.evalPage ?? e.page;
      continue;
    }
    // Numaralı ama "Tema/ÜNİTE" sözcüğü ayrı satırda ("1. GEÇMİŞİN İNŞA ... 10" + "ÜNİTE")
    if ((m = text.match(/^(\d+)\.\s+(.+)$/)) && Number(m[1]) === (units.at(-1)?.no ?? 0) + 1) {
      cur = { no: Number(m[1]), kind: "unite", title: m[2], page: e.page, topics: [] };
      units.push(cur);
      lastTopic = null;
      continue;
    }
  }
  return { units, issues };
}

/** Konu ve ünite bitiş sayfalarını (basılı) hesaplar. */
export function assignRanges(units, bookLastPrinted) {
  for (let i = 0; i < units.length; i++) {
    const u = units[i];
    const next = units[i + 1];
    const unitEnd = u.evalPage ? u.evalPage - 1 : next ? next.page - 1 : (u.endMarker ?? bookLastPrinted + 1) - 1;
    u.endPage = Math.max(u.page, next ? Math.max(next.page - 1, unitEnd) : unitEnd);
    for (let j = 0; j < u.topics.length; j++) {
      const t = u.topics[j];
      const nt = u.topics[j + 1];
      t.endPage = nt ? Math.max(t.page, nt.page - 1) : Math.max(t.page, u.evalPage ? u.evalPage - 1 : u.endPage);
      for (let k = 0; k < (t.sections?.length ?? 0); k++) {
        const sec = t.sections[k];
        const ns = t.sections[k + 1];
        sec.endPage = ns ? Math.max(sec.page, ns.page - 1) : t.endPage;
      }
    }
  }
  return units;
}
