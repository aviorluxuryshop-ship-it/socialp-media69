"use client";

import clsx from "clsx";
import { BookMarked, Check, ClipboardCheck, History, Layers, PenLine, RotateCcw, Timer } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { MaterialPicker, type PickedMaterial } from "@/components/MaterialPicker";
import { TopicPicker } from "@/components/TopicPicker";
import { Notice, PageHeader, Segmented, Sheet, Spinner } from "@/components/ui";
import { errorText, useAi, useServerStatus } from "@/lib/ai/client";
import type { Material } from "@/lib/ai/types";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { editionLabel, getBook, resolveTopic, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { makeRevisionExam, suggestedMinutes } from "@/lib/exam/analysis";
import { timeAgo } from "@/lib/dates";
import { mistakePool } from "@/lib/memory/insights";
import { noteText, uploadText } from "@/lib/materials";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { Difficulty, ExamData, ExamKind, ExamRecord, Question, QuestionType } from "@/lib/types";

const KINDS: { id: ExamKind; title: string; text: string; icon: typeof ClipboardCheck }[] = [
  { id: "topic", title: "Konu testi", text: "Bir dersin seçtiğin konularından çoktan seçmeli sorular.", icon: ClipboardCheck },
  { id: "mixed", title: "Karma test", text: "Birden çok konu ve dersten karışık sorular.", icon: Layers },
  { id: "written", title: "Yazılı çalışması", text: "Kısa cevaplı ve açık uçlu sorular; kendini puanlama anahtarıyla değerlendirirsin.", icon: PenLine },
  { id: "mock", title: "Deneme sınavı", text: "Süreli, ders karışık, sonucu en sonda gösterilen sınav.", icon: Timer },
  { id: "revision", title: "Hata tekrarı", text: "Daha önce yanlış yaptığın soruları yeniden çöz.", icon: RotateCcw },
];

const DIFFS: { value: Difficulty | "karisik"; label: string }[] = [
  { value: "kolay", label: "Kolay" },
  { value: "orta", label: "Orta" },
  { value: "zor", label: "Zor" },
  { value: "karisik", label: "Karışık" },
];

function Builder() {
  const { profile, toast } = useApp();
  const auth = useAuth();
  const status = useServerStatus();
  const ai = useAi();
  const router = useRouter();
  const params = useSearchParams();
  const { create } = useStoreCtx();
  const exams = useRecords("exam", { limit: 30 });
  const attempts = useRecords("attempt", { limit: 100 });
  const notes = useRecords("note", { limit: 200 });
  const uploads = useRecords("upload", { limit: 200 });

  const [kind, setKind] = useState<ExamKind>(params.get("tur") === "revision" ? "revision" : "topic");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [topics, setTopics] = useState<Record<string, string[]>>({});
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty | "karisik">("karisik");
  const [timed, setTimed] = useState(false);
  const [minutes, setMinutes] = useState(15);
  const [instant, setInstant] = useState(true);
  const [mats, setMats] = useState<PickedMaterial[]>([]);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [pickMat, setPickMat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ready, setReady] = useState<ExamRecord | null>(null);
  const applied = useRef(false);

  const multi = kind === "mixed" || kind === "mock";
  const allSubjects = profile?.subjectIds ?? [];
  const activeSubjects = subjects.length ? subjects : allSubjects.slice(0, 1);
  const pool = useMemo(() => mistakePool(attempts.items), [attempts.items]);

  // URL: ?konu=…  ?not=…  ?yukleme=…
  useEffect(() => {
    if (applied.current || !profile) return;
    const k = params.get("konu");
    const n = params.get("not");
    const u = params.get("yukleme");
    if (k) {
      applied.current = true;
      const b = getBook(Number(k.match(/^b(\d+)-/)?.[1]));
      if (b) {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- adres çubuğundaki parametrelerle bir kez ön doldurma
        setSubjects([b.subjectId]);
        setTopics({ [b.subjectId]: [k] });
      }
    } else if (n) {
      applied.current = true;
      const x = notes.items.find((i) => i.id === n);
      if (x) setMats([{ type: "note", id: x.id, title: x.title || "Not" }]);
    } else if (u) {
      applied.current = true;
      const x = uploads.items.find((i) => i.id === u);
      if (x) setMats([{ type: "upload", id: x.id, title: x.name }]);
    }
  }, [params, profile, notes.items, uploads.items]);

  // Tür değişince varsayılanları ayarla
  function changeKind(next: ExamKind) {
    setKind(next);
    if (next === "mock") {
      setCount(20);
      setTimed(true);
      setMinutes(suggestedMinutes(20));
      setInstant(false);
    } else if (next === "written") {
      setCount(6);
      setTimed(false);
      setInstant(false);
    } else if (next === "topic" || next === "mixed") {
      setCount(10);
      setTimed(false);
      setInstant(next === "topic");
    }
    if (!(next === "mixed" || next === "mock")) setSubjects((cur) => cur.slice(0, 1));
  }

  const bookIdsFor = (sid: string) => (profile?.bookIds ?? []).filter((id) => getBook(id)?.subjectId === sid);
  const aiOn = Boolean(status?.aiReady) && (!status?.accounts || auth.status === "signed-in");
  const chosenTopics = activeSubjects.flatMap((s) => topics[s] ?? []);
  const books = [...new Set(chosenTopics.map((t) => resolveTopic(t)?.book.id).filter((x): x is number => typeof x === "number"))].map((id) => getBook(id)!);
  const missingTopics = activeSubjects.some((s) => !(topics[s]?.length));
  const canGenerate = kind === "revision" ? pool.length > 0 : aiOn && !missingTopics && activeSubjects.length > 0;

  function toggleSubject(s: string) {
    setSubjects((cur) => {
      const base = cur.length ? cur : activeSubjects;
      if (multi) return base.includes(s) ? base.filter((x) => x !== s) : base.length < 4 ? [...base, s] : base;
      return [s];
    });
  }

  async function startRevision() {
    const data = makeRevisionExam(pool, Math.min(count, pool.length));
    if (!data) return;
    const rec = await create("exam", data);
    router.push(`/sinav/coz?id=${rec.id}&anlik=${instant ? 1 : 0}`);
  }

  async function generate() {
    if (!profile) return;
    setBusy(true);
    setErr(null);
    try {
      const materials: Material[] = mats.flatMap((m): Material[] => {
        if (m.type === "note") {
          const n = notes.items.find((x) => x.id === m.id);
          return n ? [{ title: m.title, text: noteText(n).slice(0, 6000), type: "note", recordId: n.id }] : [];
        }
        const u = uploads.items.find((x) => x.id === m.id);
        return u ? [{ title: m.title, text: uploadText(u).slice(0, 6000), type: "upload", recordId: u.id }] : [];
      });
      const types: QuestionType[] = kind === "written" ? ["written", "short"] : ["mcq"];
      const r = await ai.postJson<{
        questions: Question[];
        generation: ExamData["generation"];
        note: string | null;
      }>("/api/ai/exam", {
        grade: profile.grade,
        examKind: kind,
        plan: activeSubjects.map((s) => ({ subjectId: s, topicIds: topics[s] ?? [] })),
        bookIds: profile.bookIds,
        count,
        difficulty,
        types,
        materials,
      });
      const title =
        kind === "mock" ? `Deneme · ${activeSubjects.map(subjectName).join(", ")}` : `${KINDS.find((k) => k.id === kind)?.title} · ${topicLabel(chosenTopics[0]) || subjectName(activeSubjects[0])}`.slice(0, 90);
      const data: ExamData = {
        title,
        examKind: kind,
        subjectIds: activeSubjects,
        topicIds: chosenTopics,
        bookIds: books.map((b) => b.id),
        difficulty,
        timeLimitMin: timed ? minutes : null,
        questions: r.questions,
        generation: r.generation,
      };
      const rec = await create("exam", data);
      setReady(rec);
      playTone("success");
      if (r.note) toast(r.note, "info");
    } catch (e) {
      setErr(errorText(e));
    }
    setBusy(false);
  }

  const dropped = ready ? ready.generation.dropped.length : 0;
  const calcOk = ready ? ready.questions.filter((q) => q.checks.calc === "passed").length : 0;
  const crossOk = ready ? ready.questions.filter((q) => q.checks.crossCheck === "passed").length : 0;

  return (
    <div>
      <PageHeader
        eyebrow="Sınava Hazırlan"
        title="Kendini sına, sonra anla"
        lead="Sorular seçtiğin resmî kitap konularına göre hazırlanır, yayımlanmadan önce doğrulanır ve her zaman “yapay zekâ üretimi” diye işaretlenir. Sonuçlar kanıt yetersizse sana “henüz bilmiyoruz” der."
      />

      <section className="mb-7" aria-label="Sınav türü">
        <h2 className="mb-3 font-display text-lg text-ink">1 · Ne tür bir sınav?</h2>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {KINDS.map((k) => {
            const on = kind === k.id;
            const Icon = k.icon;
            return (
              <button
                key={k.id}
                role="radio"
                aria-checked={on}
                onClick={() => changeKind(k.id)}
                className={clsx("card flex gap-3.5 p-4 text-left transition-colors", on ? "border-accent/60 bg-accent-soft/50" : "hover:bg-surface-2")}
              >
                <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", on ? "bg-accent text-accent-ink" : "bg-surface-2 text-accent")}>
                  <Icon size={19} />
                </span>
                <span>
                  <span className="block font-display text-[1.05rem] text-ink">{k.title}</span>
                  <span className="mt-0.5 block text-[0.88rem] leading-snug text-ink-3">{k.text}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {kind === "revision" ? (
        <section className="card space-y-4 p-5">
          <h2 className="font-display text-lg text-ink">Yanlışlarından tekrar</h2>
          {attempts.loading ? null : pool.length === 0 ? (
            <Notice tone="info">Henüz tekrar edilecek yanlışın yok. Bir test çözdükten sonra yanlış yaptığın sorular burada toplanır.</Notice>
          ) : (
            <>
              <p className="text-ink-2">
                Önceki denemelerinde doğru yapamadığın <strong>{pool.length}</strong> soru var. Aynı sorular yeniden gelir; doğru yaptıkça listeden düşer.
              </p>
              <label className="flex items-center gap-3 text-sm">
                <span className="text-ink-2">Soru sayısı</span>
                <input type="range" min={3} max={Math.min(20, pool.length)} value={Math.min(count, pool.length)} onChange={(e) => setCount(Number(e.target.value))} className="flex-1 accent-[var(--accent)]" />
                <span className="w-8 text-right font-semibold tabular-nums text-ink">{Math.min(count, pool.length)}</span>
              </label>
              <button className="btn btn-primary" onClick={() => void startRevision()}>
                Tekrar testini başlat
              </button>
            </>
          )}
        </section>
      ) : (
        <>
          <section className="card mb-7 space-y-5 p-4 sm:p-5" aria-label="Ders ve konular">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg text-ink">2 · Ders ve konular</h2>
              {multi && <span className="text-[13px] text-ink-3">En fazla 4 ders</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {allSubjects.map((s) => {
                const on = activeSubjects.includes(s);
                return (
                  <button key={s} className={clsx("chip min-h-10", on && "is-on")} aria-pressed={on} onClick={() => toggleSubject(s)}>
                    {on && <Check size={14} />}
                    {subjectName(s)}
                  </button>
                );
              })}
            </div>
            <div className="space-y-3">
              {activeSubjects.map((s) => {
                const sel = topics[s] ?? [];
                const bk = bookIdsFor(s);
                return (
                  <div key={s} className="rounded-2xl border border-line bg-surface-2/40 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-ink">{subjectName(s)}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => setPickFor(s)}>
                        <BookMarked size={15} /> {sel.length ? `${sel.length} konu seçili` : "Konu seç"}
                      </button>
                    </div>
                    {sel.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {sel.map((t) => (
                          <li key={t}>
                            <button className="badge badge-accent max-w-[300px] truncate py-1" aria-label={`${topicLabel(t)} seçimini kaldır`} onClick={() => setTopics({ ...topics, [s]: sel.filter((x) => x !== t) })}>
                              {topicLabel(t)} ✕
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {bk.length === 0 && (
                      <p className="mt-2 text-[13px] text-ink-3">
                        Bu ders için kitap seçilmedi.{" "}
                        <Link href="/kitaplarim" className="text-accent underline-offset-4 hover:underline">
                          Kitap seç
                        </Link>
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {books.length > 0 && (
              <div className="rounded-2xl bg-surface-2/60 px-4 py-3 text-[0.88rem] leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">Kaynak: </span>
                {books.map((b) => `${b.title.replace(/\.Sınıf/, ". sınıf")} (${editionLabel(b)})`).join("; ")}
                {mats.length ? ` ve ${mats.length} kendi materyalin` : ""}.
              </div>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setPickMat(true)}>
              {mats.length ? `${mats.length} materyal seçili` : "Kendi notumu/belgemi kaynak ekle (isteğe bağlı)"}
            </button>
          </section>

          <section className="card mb-7 space-y-5 p-4 sm:p-5" aria-label="Ayarlar">
            <h2 className="font-display text-lg text-ink">3 · Ayarlar</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-baseline justify-between text-sm font-semibold text-ink">
                  Soru sayısı <span className="tabular-nums">{count}</span>
                </span>
                <input type="range" min={kind === "written" ? 3 : 5} max={kind === "written" ? 10 : 30} value={count} onChange={(e) => setCount(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
              </label>
              <div>
                <span className="mb-2 block text-sm font-semibold text-ink">Zorluk</span>
                <Segmented value={difficulty} onChange={setDifficulty} options={DIFFS} label="Zorluk" size="sm" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-4">
              <label className="flex items-center gap-2.5 text-[0.95rem] text-ink">
                <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
                Süre sınırı
              </label>
              {timed && (
                <label className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="number" min={5} max={180} value={minutes} onChange={(e) => setMinutes(Math.max(5, Math.min(180, Number(e.target.value) || 5)))} className="field w-20 py-2 text-center" aria-label="Dakika" /> dakika
                  <button className="text-accent underline-offset-4 hover:underline" onClick={() => setMinutes(suggestedMinutes(count, kind === "written" ? "mixed" : "mcq"))}>
                    önerilen
                  </button>
                </label>
              )}
              {kind !== "written" && kind !== "mock" && (
                <label className="flex items-center gap-2.5 text-[0.95rem] text-ink">
                  <input type="checkbox" className="h-5 w-5 accent-[var(--accent)]" checked={instant} onChange={(e) => setInstant(e.target.checked)} />
                  Her sorudan sonra cevabı göster
                </label>
              )}
            </div>
          </section>
        </>
      )}

      {!aiOn && kind !== "revision" && status && (
        <div className="mb-5">
          <Notice
            tone="warn"
            title={!status.ai ? "Yapay zekâ bu sürümde henüz etkin değil" : status.accounts && auth.status !== "signed-in" ? "Soru üretmek için giriş yap" : "Yapay zekâ henüz açılmadı"}
            action={
              status.ai && status.accounts && auth.status !== "signed-in" ? (
                <Link href="/giris" className="btn btn-primary btn-sm">
                  Giriş yap
                </Link>
              ) : undefined
            }
          >
            Yeni soru üretimi yapay zekâ gerektirir. “Hata tekrarı” ve daha önce hazırlanmış sınavlar yapay zekâsız çalışır.
          </Notice>
        </div>
      )}

      {kind !== "revision" && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-3">{missingTopics ? "Her ders için en az bir konu seç." : `${chosenTopics.length} konu · ${count} soru`}</p>
          <button className="btn btn-primary" disabled={!canGenerate || busy} onClick={() => void generate()}>
            {busy ? <Spinner /> : <ClipboardCheck size={18} />} {busy ? "Hazırlanıyor…" : "Sınavı hazırla"}
          </button>
        </div>
      )}
      {busy && (
        <p className="mt-3 text-center text-sm leading-relaxed text-ink-3">
          Kaynak sayfalar okunuyor, sorular yazılıyor ve her soru ayrıca doğrulanıyor. Bu 30–90 saniye sürebilir; sayfadan ayrılma.
        </p>
      )}
      {err && (
        <div className="mt-4">
          <Notice tone="error" title="Sınav hazırlanamadı">
            {err}
          </Notice>
        </div>
      )}

      {/* Geçmiş */}
      <h2 className="mb-3 mt-12 flex items-center gap-2 font-display text-xl text-ink">
        <History size={19} className="text-ink-3" /> Sınavlarım
      </h2>
      {exams.items.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz sınav hazırlamadın.</p>
      ) : (
        <ul className="card hair overflow-hidden">
          {exams.items.slice(0, 8).map((e) => {
            const last = attempts.items.filter((a) => a.examId === e.id).sort((a, b) => b.finishedAt - a.finishedAt)[0];
            return (
              <li key={e.id} className="flex flex-wrap items-center gap-3 px-4 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{e.title}</p>
                  <p className="text-[13px] text-ink-3">
                    {e.questions.length} soru · {timeAgo(e.createdAt)}
                    {last ? " · son deneme sonucu hazır" : ""}
                  </p>
                </div>
                {last && (
                  <Link href={`/sinav/sonuc?deneme=${last.id}`} className="btn btn-ghost btn-sm">
                    Sonuç
                  </Link>
                )}
                <Link href={`/sinav/coz?id=${e.id}&anlik=${e.examKind === "topic" ? 1 : 0}`} className="btn btn-secondary btn-sm">
                  {last ? "Tekrar çöz" : "Çöz"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {pickFor && (
        <TopicPicker
          open
          onClose={() => setPickFor(null)}
          bookIds={bookIdsFor(pickFor)}
          value={topics[pickFor] ?? []}
          onChange={(v) => setTopics({ ...topics, [pickFor]: v })}
          multiple
          title={`${subjectName(pickFor)} · konular`}
        />
      )}
      <MaterialPicker open={pickMat} onClose={() => setPickMat(false)} value={mats} onChange={setMats} max={2} />

      <Sheet open={ready !== null} onClose={() => setReady(null)} title="Sınavın hazır">
        {ready && (
          <div className="space-y-4">
            <p className="text-[1rem] leading-relaxed text-ink">
              <strong>{ready.questions.length}</strong> soru hazır{ready.generation.requested !== ready.questions.length ? ` (${ready.generation.requested} istedin)` : ""}.
            </p>
            <ul className="space-y-1.5 rounded-2xl bg-surface-2/60 p-4 text-[0.92rem] leading-relaxed text-ink-2">
              <li>
                <Check size={14} className="mr-1.5 inline text-ok" />
                Yapı kontrolü: tüm sorular geçti.
              </li>
              <li>
                <Check size={14} className="mr-1.5 inline text-ok" />
                {calcOk > 0 ? `${calcOk} sorunun cevabı ayrı bir hesapla doğrulandı.` : "Sayısal hesap doğrulaması gerektiren soru yoktu."}
              </li>
              <li>
                <Check size={14} className="mr-1.5 inline text-ok" />
                {crossOk > 0 ? `${crossOk} soru bağımsız çözümle aynı cevaba ulaştı.` : "Bağımsız çözüm kontrolü uygulanamadı."}
              </li>
              {dropped > 0 && <li>{dropped} soru doğrulamayı geçemediği için elendi.</li>}
              <li>Sorular yapay zekâ ürettiği sorulardır; resmî MEB sorusu değildir.</li>
            </ul>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setReady(null)}>
                Sonra
              </button>
              <button className="btn btn-primary" onClick={() => router.push(`/sinav/coz?id=${ready.id}&anlik=${instant && kind !== "mock" && kind !== "written" ? 1 : 0}`)}>
                Sınava başla
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

export default function ExamPage() {
  return (
    <Suspense fallback={null}>
      <Builder />
    </Suspense>
  );
}
