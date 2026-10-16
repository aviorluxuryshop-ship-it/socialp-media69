// Libero — mantık ve veri denetimi (tarayıcı gerekmez).
//
//   node scripts/check-logic.mjs
//
// Proje TypeScript'ini geçici bir klasöre derler, ardından gerçek modülleri yükleyip şunları sınar:
//  • veri doğrulayıcıları (teknik, egzersiz, vücut pozisyonu) hem sağlam veride hem bilerek bozulmuş veride
//  • program üreticinin değişmezleri: ortam/ekipman/yaş uyumu, fiziksel odak, tekrar eden anahtar yok
//  • profil geçişi (v1 → v2) ve eski programların bozulmadan korunması
// Hata varsa çıkış kodu 1'dir; sahte "geçti" yoktur.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'libero-logic-'));
const out = path.join(tmp, 'out');

// ── 1) Derleme ───────────────────────────────────────────────
fs.writeFileSync(
  path.join(tmp, 'tsconfig.json'),
  JSON.stringify({
    extends: path.join(root, 'tsconfig.json'),
    compilerOptions: { noEmit: false, outDir: out, rootDir: root, incremental: false, plugins: [], jsx: 'preserve', declaration: false, sourceMap: false, baseUrl: root, typeRoots: [path.join(root, 'node_modules/@types')], types: ['node'] },
    include: [path.join(root, 'lib/program.ts'), path.join(root, 'lib/store.ts'), path.join(root, 'lib/environments.ts'), path.join(root, 'lib/training.ts'), path.join(root, 'data/index.ts')],
    exclude: [],
  }),
);
try {
  execFileSync(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '-p', path.join(tmp, 'tsconfig.json')], { stdio: 'pipe' });
} catch (e) {
  console.error('TypeScript derlemesi başarısız:\n' + (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? ''));
  process.exit(1);
}

// ── 2) "@/" ve uzantısız göreli içe aktarmalar için çözümleyici ──
const hook = `
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const OUT = ${JSON.stringify(out)};
function find(base) {
  for (const c of [base + '.js', path.join(base, 'index.js'), base]) {
    try { if (fs.statSync(c).isFile()) return c; } catch {}
  }
  return null;
}
export async function resolve(spec, ctx, next) {
  if (spec.startsWith('@/')) {
    const f = find(path.join(OUT, spec.slice(2)));
    if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
  }
  if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL && ctx.parentURL.startsWith('file:') && !path.extname(spec)) {
    const f = find(path.resolve(path.dirname(new URL(ctx.parentURL).pathname), spec));
    if (f) return { url: pathToFileURL(f).href, shortCircuit: true };
  }
  return next(spec, ctx);
}
`;
register('data:text/javascript,' + encodeURIComponent(hook), pathToFileURL(root + '/'));
// çıktı klasörü ES modülü olarak yüklensin
fs.writeFileSync(path.join(out, 'package.json'), JSON.stringify({ type: 'module' }));
// node_modules (react vb.) çözümü için bağlantı
try { fs.symlinkSync(path.join(root, 'node_modules'), path.join(out, 'node_modules'), 'dir'); } catch {}

const load = (rel) => import(pathToFileURL(path.join(out, rel)).href);

// ── 3) Küçük test çerçevesi ───────────────────────────────────
let pass = 0;
const fails = [];
function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}
async function test(name, fn) {
  try {
    await fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fails.push(`${name}: ${e.message}`);
    console.log(`  ✗ ${name}\n      ${e.message}`);
  }
}

console.log('Libero mantık denetimi\n');

const env = await load('lib/environments.js');
const training = await load('lib/training.js');
const store = await load('lib/store.js');
const prog = await load('lib/program.js');
const data = await load('data/index.js'); // doğrulayıcılar yüklenirken çalışır; hata varsa fırlatır
const exMod = await load('data/exercises.js');
const bpMod = await load('data/body-position.js');
const validate = await load('data/validate.js');

const { EXERCISES, EX_BY_ID, validateExercises } = exMod;
const { TECHNIQUES, TECH_BY_ID } = data;

// ── Veri doğrulayıcıları ──────────────────────────────────────
await test('Veri yüklenirken tüm doğrulayıcılar geçer', async () => {
  ok(TECHNIQUES.length >= 126, `teknik sayısı ${TECHNIQUES.length}`);
  ok(EXERCISES.length >= 80, `egzersiz sayısı ${EXERCISES.length}`);
  ok(validateExercises().length === 0, validateExercises().join('; '));
});

await test('Egzersiz doğrulayıcısı bozuk veriyi reddeder', async () => {
  const base = EX_BY_ID['comelme'];
  const gymOnPitch = { ...EX_BY_ID['bacak-pres'], id: 'x1', env: ['saha'] };
  ok(validateExercises([base, gymOnPitch]).some((m) => /bulunamayan ekipman|yalnızca salonda/.test(m)), 'salon aleti sahada kabul edildi');
  const young = { ...EX_BY_ID['halter-squat'], id: 'x2', minAge: 10 };
  ok(validateExercises([base, young]).some((m) => /en erken yaş/.test(m)), 'yaş sınırı ihlali kabul edildi');
  const nomist = { ...base, id: 'x3', mistakes: [] };
  ok(validateExercises([nomist]).some((m) => /hata sayısı/.test(m)), 'hatasız egzersiz kabul edildi');
  const dupe = { ...base };
  ok(validateExercises([base, dupe]).some((m) => /yinelenen/.test(m)), 'yinelenen kimlik kabul edildi');
  const badAlt = { ...base, id: 'x4', alt: ['yok-boyle-bir-sey'] };
  ok(validateExercises([base, badAlt]).some((m) => /bilinmeyen alternatif/.test(m)), 'bilinmeyen alternatif kabul edildi');
});

await test('Vücut pozisyonu doğrulayıcısı kopya/kısa/bilinmeyen kaydı reddeder', async () => {
  const ids = new Set(TECHNIQUES.map((t) => t.id));
  const good = bpMod.BODY_POSITION;
  ok(validate.validateBodyPositions(good, ids).length === 0, 'gerçek veri hatalı: ' + validate.validateBodyPositions(good, ids).join('; '));
  const one = good['sert-sut'];
  ok(validate.validateBodyPositions({ a: one, b: { ...one } }, new Set(['a', 'b'])).some((m) => /çok benzer/.test(m)), 'aynı metin kabul edildi');
  ok(validate.validateBodyPositions({ 'sert-sut': { ...one, hips: 'kısa' } }, ids).some((m) => /çok kısa/.test(m)), 'kısa alan kabul edildi');
  ok(validate.validateBodyPositions({ 'olmayan-teknik': one }, ids).some((m) => /bilinmeyen teknik/.test(m)), 'bilinmeyen teknik kabul edildi');
  ok(validate.validateBodyPositions({ 'sert-sut': { ...one, hips: one.torso } }, ids).some((m) => /aynı metni/.test(m)), 'tekrar eden alan kabul edildi');
});

await test('Vücut pozisyonu: yalnızca vuruş teknikleri, hepsi ayrı metin', async () => {
  const keys = Object.keys(bpMod.BODY_POSITION);
  ok(keys.length >= 45, `kapsam ${keys.length}`);
  for (const k of keys) ok(TECH_BY_ID[k], `${k} teknik değil`);
  for (const t of ['surme', 'kalecilik', 'topsuz', 'savunma', 'kontrol']) {
    ok(!keys.some((k) => TECH_BY_ID[k].cat === t), `${t} kategorisi kapsam dışı olmalı`);
  }
});

await test('Kavisli pas / trivela ayrımı: temas bölgeleri, bağlantılar, karıştırma notu', async () => {
  const kp = TECH_BY_ID['kavisli-pas'];
  const tp = TECH_BY_ID['trivela-pasi'];
  const ud = TECH_BY_ID['ust-dis-vurus'];
  ok(kp && tp && ud, 'teknikler eksik');
  ok(kp.foot.includes('ic') && !kp.foot.includes('ustDis'), 'kavisli-pas yanlış temas bölgesi: ' + kp.foot);
  ok(tp.foot.length === 1 && tp.foot[0] === 'ustDis', 'trivela-pasi yanlış temas bölgesi: ' + tp.foot);
  ok(ud.foot.includes('ustDis'), 'üst dış vuruş temas bölgesi');
  ok(!kp.related.includes('ust-dis-vurus'), 'kavisli pas artık üst dış vuruşa bağlanmamalı');
  ok(tp.related.includes('kavisli-pas') && tp.related.includes('ust-dis-vurus'), 'trivela pası ilgili teknik bağlantıları');
  ok(kp.related.includes('trivela-pasi'), 'kavisli pas → trivela pası bağlantısı');
  ok(kp.distinct?.some((d) => d.id === 'trivela-pasi') && tp.distinct?.some((d) => d.id === 'kavisli-pas'), 'karıştırma notu karşılıklı olmalı');
  ok(/dış/.test(tp.contact) && !/iç yüz/i.test(tp.contact), 'trivela pası temas metni');
});

// ── Ortam / ekipman kuralları ─────────────────────────────────
await test('Ekipman kuralları: ev dambılı yetişkin, salon aletleri 15+, ev ekipmanı salona karışmaz', async () => {
  const has = (e, sel, age, id) => env.availableEquip(e, sel, age).has(id);
  ok(!has('ev', ['dambil'], 14, 'dambil'), 'evde 14 yaş dambıl');
  ok(has('ev', ['dambil'], 18, 'dambil'), 'evde 18 yaş dambıl yok');
  ok(!has('salon', ['halter', 'makine'], 14, 'halter') && !has('salon', ['halter', 'makine'], 14, 'makine'), '14 yaş salon aletleri');
  ok(has('salon', ['halter'], 16, 'halter'), '16 yaş halter');
  ok(!has('ev', ['halter', 'makine', 'kablo', 'barfiks'], 30, 'halter'), 'evde halter bulunmamalı');
  ok(!has('saha', ['dambil', 'halter'], 30, 'dambil'), 'sahada dambıl bulunmamalı');
  ok(has('saha', ['top', 'koni'], 10, 'top'), 'sahada top');
  ok(!env.ENV_META.salon.options.includes('merdiven') && !env.ENV_META.salon.options.includes('top'), 'salon seçeneklerinde ev/saha ekipmanı var');
  ok(!env.ENV_META.ev.options.includes('halter') && !env.ENV_META.ev.options.includes('makine') && !env.ENV_META.ev.options.includes('kablo'), 'ev seçeneklerinde salon aleti var');
});

await test('Ortama özgü egzersiz envanteri yeterli', async () => {
  const inEnv = (e) => EXERCISES.filter((x) => x.env.includes(e));
  const gym = EXERCISES.filter((x) => x.env.length === 1 && x.env[0] === 'salon');
  ok(gym.length >= 14, `yalnızca salonda yapılan egzersiz sayısı ${gym.length}`);
  ok(gym.filter((x) => x.equip.some((q) => ['halter', 'makine', 'kablo', 'bench'].includes(q))).length >= 8, 'salon makine/halter egzersizi az');
  ok(inEnv('ev').filter((x) => x.equip.every((q) => q === 'yok' || q === 'sandalye')).length >= 15, 'ekipmansız ev egzersizi az');
  ok(inEnv('saha').length >= 25, 'saha egzersizi az');
  ok(EXERCISES.filter((x) => x.cat === 'top').length >= 4, 'bireysel top çalışması az');
});

// ── Program üretimi ───────────────────────────────────────────
const ENV_SETS = [['ev'], ['salon'], ['saha'], ['ev', 'salon'], ['ev', 'saha'], ['salon', 'saha'], ['ev', 'salon', 'saha']];
const goals = ['dengeli', 'hiz-cio', 'dayaniklilik', 'kuvvet-guc'];
const ages = [7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 25];
const allEquip = (envs) => Object.fromEntries(['ev', 'salon', 'saha'].map((e) => [e, envs.includes(e) ? [...env.ENV_META[e].options] : []]));
const noEquip = () => ({ ev: [], salon: [], saha: [] });

function gen(age, goal, envs, by, perWeek = 4, level = 3, positions = [], minutes = 60) {
  return prog.generateProgram({ age, band: training.ageBand(age), level, goal, positions, equipment: [], equipByEnv: by, envs, perWeek, minutes });
}

await test('Üretilen programda her egzersiz seçilen ortam ve ekipmana, yaşa uygun (geniş tarama)', async () => {
  let programs = 0;
  let items = 0;
  for (const age of ages) {
    for (const goal of goals) {
      for (const envs of ENV_SETS) {
        for (const by of [allEquip(envs), noEquip()]) {
          for (const perWeek of [2, 4, 6]) {
            const p = gen(age, goal, envs, by, perWeek, ((age % 5) + 1));
            programs++;
            const keys = new Set();
            for (const s of p.sessions) {
              ok(envs.includes(s.env), `oturum ortamı seçilmemiş: ${s.env} ∉ ${envs} (yaş ${age}, ${goal})`);
              ok(s.focus !== 'teknik' && s.focus !== 'saha', `fiziksel olmayan odak: ${s.focus}`);
              const sk = new Set();
              for (const it of s.items) {
                items++;
                ok(it.kind === 'ex', `egzersiz dışı öğe: ${it.kind} ${it.ref}`);
                ok(!sk.has(it.key), `yinelenen anahtar ${it.key}`);
                sk.add(it.key);
                const ex = EX_BY_ID[it.ref];
                ok(ex, `bilinmeyen egzersiz ${it.ref}`);
                ok(training.allowedFor(ex, age), `${it.ref}: ${age} yaş için uygun değil`);
                const avail = env.availableEquip(s.env, by[s.env] ?? [], age);
                for (const q of ex.equip) ok(q === 'yok' || avail.has(q), `${it.ref} (${s.env}, yaş ${age}): seçilmemiş/erişilemeyen ekipman ${q}`);
                ok(ex.env.includes(s.env), `${it.ref}: ${s.env} ortamı için işaretli değil`);
                ok(it.sets >= 1 && it.dose, `${it.ref}: doz yok`);
              }
              keys.add(s.id);
            }
            ok(keys.size === p.sessions.length, 'yinelenen oturum kimliği');
            ok(p.sessions.length === perWeek, `oturum sayısı ${p.sessions.length} ≠ ${perWeek}`);
          }
        }
      }
    }
  }
  ok(programs > 1500 && items > 10000, `tarama küçük: ${programs} program, ${items} öğe`);
  console.log(`      (${programs} program, ${items} egzersiz öğesi denetlendi)`);
});

await test('Ev oturumları yalnızca evde yapılabilir hareketlerden oluşur (ekipmansız ev)', async () => {
  for (const age of [9, 14, 17, 25]) {
    const p = gen(age, 'dengeli', ['ev'], noEquip(), 5);
    for (const s of p.sessions) {
      ok(s.env === 'ev', 'ev dışı oturum');
      for (const it of s.items) {
        const ex = EX_BY_ID[it.ref];
        ok(ex.env.includes('ev'), `${it.ref} evde yapılamaz`);
        ok(ex.equip.every((q) => q === 'yok' || q === 'sandalye'), `${it.ref}: ekipmansız evde ${ex.equip}`);
      }
    }
  }
});

await test('Salon oturumları gerçek salon hareketleri içerir (15+ yaş, tam donanım); ev ekipmanı gerektirmez', async () => {
  for (const age of [15, 16, 17, 18, 25]) {
    const p = gen(age, 'kuvvet-guc', ['salon'], allEquip(['salon']), 4, 4);
    const strength = p.sessions.filter((s) => s.focus === 'alt-vucut' || s.focus === 'ust-vucut');
    ok(strength.length >= 2, 'kuvvet oturumu yok');
    for (const s of strength) {
      ok(s.env === 'salon', 'salon dışı kuvvet oturumu');
      const gym = s.items.filter((it) => EX_BY_ID[it.ref].equip.some((q) => ['halter', 'makine', 'kablo', 'bench', 'dambil', 'barfiks'].includes(q)));
      ok(gym.length >= 2, `${age} yaş ${s.title}: salon aleti/ağırlığı kullanan hareket sayısı ${gym.length}`);
    }
  }
  const young = gen(13, 'kuvvet-guc', ['salon'], allEquip(['salon']), 4);
  for (const s of young.sessions) for (const it of s.items) ok(!EX_BY_ID[it.ref].equip.some((q) => ['halter', 'makine', 'kablo', 'bench'].includes(q)), `13 yaşta ${it.ref}`);
});

await test('Salon ekipmanı seçili değilse o alet kullanılmaz; seçili olan kullanılır', async () => {
  const noMachines = { ev: [], saha: [], salon: ['dambil', 'bench'] };
  const p = gen(17, 'kuvvet-guc', ['salon'], noMachines, 5, 4);
  for (const s of p.sessions) for (const it of s.items) ok(!EX_BY_ID[it.ref].equip.some((q) => ['halter', 'makine', 'kablo', 'barfiks', 'kardiyo', 'kutu'].includes(q)), `${it.ref} seçilmemiş alet`);
  ok(p.sessions.some((s) => s.items.some((it) => EX_BY_ID[it.ref].equip.includes('dambil'))), 'seçilen dambıl kullanılmadı');
});

await test('Saha oturumları sahada yapılır: sürat, çeviklik, dayanıklılık, bireysel top', async () => {
  const p = gen(14, 'dengeli', ['saha'], { ev: [], salon: [], saha: ['top', 'koni'] }, 5, 3);
  ok(p.sessions.every((s) => s.env === 'saha'), 'saha dışı');
  const names = p.sessions.flatMap((s) => s.items.map((i) => i.ref));
  ok(names.some((r) => EX_BY_ID[r].cat === 'top'), 'bireysel top çalışması yok');
  ok(names.some((r) => EX_BY_ID[r].cat === 'hiz' || EX_BY_ID[r].cat === 'ceviklik'), 'sürat/çeviklik yok');
  const noBall = gen(14, 'dengeli', ['saha'], { ev: [], salon: [], saha: [] }, 5, 3);
  ok(!noBall.sessions.some((s) => s.items.some((i) => EX_BY_ID[i.ref].equip.some((q) => q === 'top' || q === 'koni'))), 'top/koni seçilmedi ama kullanıldı');
});

await test('Program fiziksel odaklıdır: teknik/taktik/topsuz koşu öğesi ya da odak yok', async () => {
  const p = gen(16, 'dengeli', ['ev', 'salon', 'saha'], allEquip(['ev', 'salon', 'saha']), 6);
  const foci = new Set(p.sessions.map((s) => s.focus));
  for (const f of foci) ok(['alt-vucut', 'ust-vucut', 'merkez', 'hiz-ceviklik', 'dayaniklilik', 'toparlanma'].includes(f), `beklenmeyen odak ${f}`);
  ok(p.sessions.every((s) => s.items.every((i) => i.kind === 'ex')), 'egzersiz dışı öğe');
  ok(!p.notes.join(' ').includes('Küçük alan oyunu'), 'takım oyunu notu');
  ok(p.notes.some((n) => /Taktik bölümündedir/.test(n)), 'taktik ayrımı notu yok');
});

await test('Çocuk (≤11): ağırlık/alet ve plyometri yok; kafa vuruşu yok', async () => {
  for (const age of [7, 9, 11]) {
    const p = gen(age, 'kuvvet-guc', ['ev', 'salon', 'saha'], allEquip(['ev', 'salon', 'saha']), 6, 5);
    for (const s of p.sessions) for (const it of s.items) {
      const ex = EX_BY_ID[it.ref];
      ok(!ex.equip.some((q) => ['dambil', 'halter', 'makine', 'kablo', 'bench', 'barfiks', 'kutu', 'kardiyo'].includes(q)), `${age} yaş ${it.ref}`);
      ok(ex.cat !== 'guc' || ex.id === 'inis-calismasi', `${age} yaş plyometri ${it.ref}`);
      ok(!/kafa/i.test(it.name), 'kafa vuruşu');
    }
  }
});

await test('Doz üst sınırları: yaş bandına göre set/tekrar sınırı', async () => {
  const sq = EX_BY_ID['comelme'];
  const d1 = training.doseFor(sq, 'u12', 5);
  const d2 = training.doseFor(sq, '12-14', 5);
  const d3 = training.doseFor(sq, '15-17', 5);
  ok(d1.sets <= 2 && d1.reps <= 10, 'u12 doz');
  ok(d2.sets <= 2 && d2.reps <= 12, '12-14 doz');
  ok(d3.sets <= 3 && d3.reps <= 12, '15-17 doz');
});

await test('Eski (yalnızca düz ekipman listeli) girdi ile de program üretilir', async () => {
  const p = prog.generateProgram({ age: 16, band: '15-17', level: 3, goal: 'dengeli', positions: [], equipment: ['top', 'koni', 'dambil', 'salon'], envs: ['ev', 'salon', 'saha'], perWeek: 4, minutes: 60 });
  ok(p.sessions.length === 4, 'oturum sayısı');
  ok(p.input.equipByEnv && p.input.equipByEnv.ev && p.input.equipByEnv.salon.length > 0, 'ortam başına ekipman yazılmadı');
});

// ── Saklama geçişi ───────────────────────────────────────────
const legacyState = () => ({
  v: 1,
  profile: { name: 'Deniz', age: 14, level: 3, positions: ['kanat'], goal: 'teknik', equipment: ['top', 'koni', 'dambil', 'salon', 'barfiks'], envs: ['ev', 'salon', 'saha'], perWeek: 5, minutes: 75 },
  levels: { 'ilk-temas': { level: 4, at: '2026-01-01T00:00:00.000Z' } },
  levelLog: [{ id: 'ilk-temas', level: 4, at: '2026-01-01T00:00:00.000Z' }],
  practiced: { 'ilk-temas': { count: 3, last: '2026-01-02T00:00:00.000Z' } },
  fav: ['ara-pas'],
  program: {
    id: 'p1',
    createdAt: '2026-01-03T00:00:00.000Z',
    input: { age: 14, band: '12-14', level: 3, goal: 'teknik', positions: ['kanat'], equipment: ['top', 'koni'], envs: ['saha'], perWeek: 3, minutes: 60 },
    sessions: [{ id: 's1', title: 'Teknik çalışma', focus: 'teknik', env: 'saha', minutes: 60, day: 0, items: [{ key: 'ara-pas-0', ref: 'ara-pas', kind: 'tech', name: 'Ara pas: Koni', sets: 1, dose: '4 × 8 pas', rest: '—' }] }],
    notes: ['eski not'],
  },
  logs: [{ id: 'l1', programId: 'p1', sessionId: 's1', title: 'Teknik çalışma', focus: 'teknik', date: '2026-01-04', startedAt: '2026-01-04T10:00:00.000Z', status: 'done', progress: { 'ara-pas-0': 1 }, items: [{ key: 'ara-pas-0', ref: 'ara-pas', kind: 'tech', name: 'Ara pas: Koni', sets: 1, dose: '4 × 8 pas', rest: '—' }] }],
  quiz: { q1: { tries: 2, right: 1, last: true, at: '2026-01-05T00:00:00.000Z' } },
  tests: [{ id: 't1', kind: 'sprint10', value: 2.1, date: '2026-01-06' }],
  board: [], videoNotes: {}, lastVisit: null, createdAt: '2026-01-01T00:00:00.000Z',
});

await test('Profil geçişi v1 → v2: ekipman ortamlara bölünür, hedef "teknik" → "dengeli", kişisel seçimler korunur', async () => {
  const s = store.sanitize(legacyState());
  ok(s.v === store.SCHEMA_VERSION && store.SCHEMA_VERSION === 2, 'şema sürümü');
  const p = s.profile;
  ok(p.goal === 'dengeli', `hedef ${p.goal}`);
  ok(!('equipment' in p), 'eski equipment alanı kaldı');
  ok(p.equipByEnv.ev.includes('dambil') && p.equipByEnv.ev.includes('koni') && p.equipByEnv.ev.includes('top'), 'ev ekipmanı: ' + p.equipByEnv.ev);
  ok(!p.equipByEnv.ev.includes('barfiks'), 'evde barfiks kalmamalı');
  ok(p.equipByEnv.salon.includes('halter') && p.equipByEnv.salon.includes('barfiks'), 'salon varsayılanları');
  ok(p.equipByEnv.saha.includes('top') && p.equipByEnv.saha.includes('koni') && !p.equipByEnv.saha.includes('dambil'), 'saha ekipmanı: ' + p.equipByEnv.saha);
  ok(p.age === 14 && p.level === 3 && p.perWeek === 5 && p.minutes === 75 && p.name === 'Deniz' && p.positions[0] === 'kanat', 'kişisel alanlar korunmadı');
  ok(p.envs.join() === 'ev,salon,saha', 'ortamlar');
});

await test('Geçişte yıldız seviyeleri, geçmiş, favoriler, test ve quiz kayıtları ve eski program aynen korunur', async () => {
  const before = legacyState();
  const s = store.sanitize(JSON.parse(JSON.stringify(before)));
  ok(JSON.stringify(s.levels) === JSON.stringify(before.levels), 'seviyeler');
  ok(JSON.stringify(s.levelLog) === JSON.stringify(before.levelLog), 'seviye günlüğü');
  ok(JSON.stringify(s.practiced) === JSON.stringify(before.practiced), 'çalışılanlar');
  ok(JSON.stringify(s.fav) === JSON.stringify(before.fav), 'favoriler');
  ok(JSON.stringify(s.logs) === JSON.stringify(before.logs), 'antrenman geçmişi');
  ok(JSON.stringify(s.program) === JSON.stringify(before.program), 'eski program değişmemeli');
  ok(JSON.stringify(s.quiz) === JSON.stringify(before.quiz) && JSON.stringify(s.tests) === JSON.stringify(before.tests), 'quiz/test');
  ok(s.createdAt === before.createdAt, 'createdAt');
});

await test('Geçiş: v2 verisi tekrar okunduğunda değişmez (idempotent); bozuk profil güvenli varsayılana döner', async () => {
  const a = store.sanitize(legacyState());
  const b = store.sanitize(JSON.parse(JSON.stringify(a)));
  ok(JSON.stringify(a.profile) === JSON.stringify(b.profile), 'ikinci okuma farklı');
  const bad = store.sanitize({ profile: { envs: 'x', equipByEnv: 5, goal: 'olmayan', equipment: 7 }, levels: null, logs: 'x' });
  ok(Array.isArray(bad.profile.envs) && bad.profile.envs.length > 0, 'ortamlar');
  ok(bad.profile.goal === 'dengeli', 'hedef');
  ok(Array.isArray(bad.logs) && bad.logs.length === 0, 'geçmiş');
  for (const e of ['ev', 'salon', 'saha']) ok(Array.isArray(bad.profile.equipByEnv[e]), `equipByEnv.${e}`);
  const empty = store.sanitize(null);
  ok(empty.profile.equipByEnv.salon.includes('halter'), 'varsayılan salon donanımı');
});

await test('Yedekten geri yükleme (dışa aktarılan v1 yedeği) yeni sürümde okunur', async () => {
  const backup = JSON.parse(JSON.stringify({ app: 'libero', exportedAt: '2026-02-01T00:00:00.000Z', data: legacyState() }));
  const s = store.sanitize(backup.data);
  ok(s.profile.equipByEnv && s.logs.length === 1 && s.program.id === 'p1', 'yedek okunamadı');
});

// ── Sonuç ─────────────────────────────────────────────────────
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n${pass}/${pass + fails.length} test geçti.`);
if (fails.length) {
  console.log('Başarısız:\n - ' + fails.join('\n - '));
  process.exit(1);
}
