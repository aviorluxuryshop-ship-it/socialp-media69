"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Library } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { BookCard } from "@/components/books";
import { CheckMark, Field, Notice } from "@/components/ui";
import { DEFAULT_AVAILABILITY, useApp } from "@/lib/app";
import { type CatalogBook, booksFor } from "@/lib/catalog";
import { nowMs } from "@/lib/dates";
import { INTERESTS, PROVINCES, SCHOOL_BY_ID, SCHOOL_TYPES, SUBJECTS, SUBJECT_BY_ID } from "@/lib/catalog/data";
import type { Grade, InterestId, ProfileRecord, SchoolTypeId } from "@/lib/types";

const STEPS = ["Sen", "Okulun", "Dersler", "Kitaplar"] as const;

/** Bir dersin kitapları: ciltler (1.Kitap/2.Kitap) birlikte, farklı sürümler (örn. İngilizce) seçmeli. */
function splitBooks(list: CatalogBook[]) {
  const volumes = list.filter((b) => b.volume);
  const alternatives = list.filter((b) => !b.volume);
  return { volumes, alternatives };
}

function defaultBooks(list: CatalogBook[], subjectIds: string[]): number[] {
  const ids: number[] = [];
  for (const s of subjectIds) {
    const { volumes, alternatives } = splitBooks(list.filter((b) => b.subjectId === s));
    ids.push(...volumes.map((b) => b.id));
    if (alternatives.length === 1) ids.push(alternatives[0].id);
  }
  return ids;
}

function Onboarding({ initial }: { initial: ProfileRecord | null }) {
  const { profile, saveProfile, toast } = useApp();
  const router = useRouter();
  const editing = Boolean(initial);

  const [step, setStep] = useState(0);
  const [name, setName] = useState(initial?.name ?? "");
  const [grade, setGrade] = useState<Grade | null>(initial?.grade ?? null);
  const [province, setProvince] = useState(initial?.province ?? "");
  const [schoolType, setSchoolType] = useState<SchoolTypeId | "">(initial?.schoolType ?? "");
  const [interest, setInterest] = useState<InterestId>(initial?.interest ?? "kararsiz");
  const [subjectIds, setSubjectIds] = useState<string[]>(initial?.subjectIds ?? []);
  const [bookIds, setBookIds] = useState<number[]>(initial?.bookIds ?? []);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const available = useMemo(() => (grade && schoolType ? booksFor({ grade, schoolType }).filter((b) => b.kind === "ders") : []), [grade, schoolType]);
  const availableSubjects = useMemo(() => {
    const ids = new Set(available.map((b) => b.subjectId));
    return SUBJECTS.filter((s) => ids.has(s.id));
  }, [available]);

  // Sınıf/okul türü değişince seçimleri varsayılana al (düzenlemede, değişmemiş eşleşmenin mevcut seçimini koru)
  function reselect(g: Grade | null, st: SchoolTypeId | "") {
    if (!g || !st) return;
    if (initial && initial.grade === g && initial.schoolType === st) {
      setSubjectIds(initial.subjectIds);
      setBookIds(initial.bookIds);
      return;
    }
    const list = booksFor({ grade: g, schoolType: st }).filter((b) => b.kind === "ders");
    const ids = SUBJECTS.filter((x) => list.some((b) => b.subjectId === x.id)).map((x) => x.id);
    setSubjectIds(ids);
    setBookIds(defaultBooks(list, ids));
  }
  function pickGrade(g: Grade) {
    if (g === grade) return;
    setGrade(g);
    reselect(g, schoolType);
  }
  function pickSchool(st: SchoolTypeId) {
    if (st === schoolType) return;
    setSchoolType(st);
    reselect(grade, st);
  }

  const school = schoolType ? SCHOOL_BY_ID.get(schoolType) : null;
  const canNext = [Boolean(grade), Boolean(province && schoolType), subjectIds.length > 0, true][step];

  const unresolved = subjectIds.filter((s) => {
    const { alternatives } = splitBooks(available.filter((b) => b.subjectId === s));
    return alternatives.length > 1 && !alternatives.some((b) => bookIds.includes(b.id));
  });

  function toggleSubject(id: string) {
    setSubjectIds((cur) => {
      const on = cur.includes(id);
      const next = on ? cur.filter((x) => x !== id) : [...cur, id];
      if (on) setBookIds((b) => b.filter((bid) => available.find((x) => x.id === bid)?.subjectId !== id));
      else setBookIds((b) => [...new Set([...b, ...defaultBooks(available, [id])])]);
      return next;
    });
  }

  function toggleBook(book: CatalogBook) {
    setBookIds((cur) => {
      if (cur.includes(book.id)) return cur.filter((x) => x !== book.id);
      // Alternatif sürümlerden yalnızca biri seçilebilir
      const siblings = book.volume ? [] : available.filter((b) => b.subjectId === book.subjectId && !b.volume).map((b) => b.id);
      return [...cur.filter((x) => !siblings.includes(x)), book.id];
    });
  }

  async function finish() {
    if (!grade || !schoolType) return;
    setBusy(true);
    try {
      await saveProfile({
        name: name.trim(),
        grade,
        province,
        schoolType,
        interest,
        subjectIds,
        bookIds,
        availability: profile?.availability ?? DEFAULT_AVAILABILITY,
        sound: profile?.sound ?? false,
        theme: profile?.theme ?? "system",
        reduceMotion: profile?.reduceMotion ?? false,
        onboardedAt: profile?.onboardedAt ?? nowMs(),
      });
      if (editing) {
        toast("Bilgilerin güncellendi.", "ok");
        router.replace("/ayarlar");
      } else {
        setDone(true);
        setTimeout(() => router.replace("/"), 1400);
      }
    } catch {
      toast("Kaydedilemedi. Lütfen tekrar dene.", "error");
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="anim-rise flex flex-col items-center gap-5 pt-20 text-center">
        <CheckMark size={72} />
        <h1 className="font-display text-3xl text-ink">Hazırsın{name ? `, ${name.trim().split(" ")[0]}` : ""}.</h1>
        <p className="max-w-sm text-ink-2">Ana sayfana yönlendiriyoruz. Dilediğin zaman Ayarlar&apos;dan değiştirebilirsin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <ol className="mb-6 flex items-center gap-2" aria-label="Adımlar">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? "step" : undefined}>
              <span className={clsx("h-1 rounded-full transition-colors duration-500", i <= step ? "bg-accent" : "bg-line-strong")} />
              <span className={clsx("text-[12px] font-medium", i === step ? "text-ink" : "text-ink-3")}>{s}</span>
            </li>
          ))}
        </ol>

        {step === 0 && (
          <section key="s0" className="anim-rise space-y-6">
            <div>
              <h1 className="font-display text-[2rem] leading-tight text-ink">{editing ? "Bilgilerini düzenle" : "Hoş geldin. Önce seni tanıyalım."}</h1>
              <p className="mt-2 text-ink-2">Yalnızca birkaç soru. Sonra doğrudan çalışmaya başlarsın.</p>
            </div>
            <Field label="Sana nasıl hitap edelim?" htmlFor="name" hint="İsteğe bağlı. Yalnızca ana sayfada selamlamak için kullanılır.">
              <input id="name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adın" autoComplete="given-name" maxLength={40} />
            </Field>
            <Field label="Kaçıncı sınıftasın?">
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sınıf">
                {([9, 10] as Grade[]).map((g) => (
                  <button
                    key={g}
                    role="radio"
                    aria-checked={grade === g}
                    onClick={() => pickGrade(g)}
                    className={clsx(
                      "card px-5 py-5 text-left transition-colors",
                      grade === g ? "border-accent/60 bg-accent-soft/50" : "hover:bg-surface-2",
                    )}
                  >
                    <span className="font-display text-3xl text-ink">{g}.</span>{" "}
                    <span className="text-ink-2">sınıf</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[13px] text-ink-3">StudyFlow şimdilik 9. ve 10. sınıfları destekliyor; diğer sınıflar doğrulanmış kitap verisi hazır olunca eklenecek.</p>
            </Field>
          </section>
        )}

        {step === 1 && (
          <section key="s1" className="anim-rise space-y-6">
            <div>
              <h1 className="font-display text-[2rem] leading-tight text-ink">Okulun</h1>
              <p className="mt-2 text-ink-2">Kitap listeni okul türüne göre hazırlıyoruz.</p>
            </div>
            <Field label="İl" htmlFor="province">
              <select id="province" className="field" value={province} onChange={(e) => setProvince(e.target.value)}>
                <option value="">Seç…</option>
                {PROVINCES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Okul türü">
              <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="Okul türü">
                {SCHOOL_TYPES.map((s) => (
                  <button
                    key={s.id}
                    role="radio"
                    aria-checked={schoolType === s.id}
                    onClick={() => pickSchool(s.id)}
                    className={clsx("card px-4 py-3.5 text-left text-[0.97rem] font-medium transition-colors", schoolType === s.id ? "border-accent/60 bg-accent-soft/50 text-ink" : "text-ink-2 hover:bg-surface-2")}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              {school?.note && (
                <div className="mt-3">
                  <Notice tone="warn">{school.note}</Notice>
                </div>
              )}
            </Field>
            <Field label="Hedeflediğin alan" hint="İsteğe bağlı. Yalnızca önerileri sıralamak için; kitap listeni etkilemez.">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((i) => (
                  <button key={i.id} className="chip" aria-pressed={interest === i.id} onClick={() => setInterest(i.id)}>
                    {i.name}
                  </button>
                ))}
              </div>
            </Field>
          </section>
        )}

        {step === 2 && (
          <section key="s2" className="anim-rise space-y-5">
            <div>
              <h1 className="font-display text-[2rem] leading-tight text-ink">Hangi derslerle çalışacaksın?</h1>
              <p className="mt-2 text-ink-2">{grade}. sınıf için resmî ders kitabı bulunan derslerin hepsi seçili geldi. İstemediklerini kaldırabilirsin.</p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {availableSubjects.map((s) => {
                const on = subjectIds.includes(s.id);
                return (
                  <button key={s.id} className={clsx("chip min-h-11 px-4", on && "is-on")} aria-pressed={on} onClick={() => toggleSubject(s.id)}>
                    {on && <Check size={15} />}
                    {s.name}
                  </button>
                );
              })}
            </div>
            <p className="text-[13px] text-ink-3">{subjectIds.length} ders seçili.</p>
          </section>
        )}

        {step === 3 && (
          <section key="s3" className="anim-rise space-y-6">
            <div>
              <h1 className="font-display text-[2rem] leading-tight text-ink">Kitaplarını doğrula</h1>
              <p className="mt-2 text-ink-2">
                Aşağıdakiler MEB&apos;in resmî portalındaki ders kitapları. Okulunda kullandığının kapağına ve sürümüne bak, sonra seç. Konu anlatımı ve sınavlar bu kitaba göre hazırlanır.
              </p>
            </div>
            {unresolved.length > 0 && (
              <Notice tone="warn" title="Bazı derslerde birden çok sürüm var">
                {unresolved.map((s) => SUBJECT_BY_ID.get(s)?.name).join(", ")} için hangisini kullandığını seçmedin. Seçmezsen kitap kaynaklı özellikler bu derste genel müfredata dayanır; sonra Kitaplarım&apos;dan seçebilirsin.
              </Notice>
            )}
            {subjectIds.map((sid) => {
              const list = available.filter((b) => b.subjectId === sid);
              if (!list.length) return null;
              return (
                <div key={sid} className="space-y-3">
                  <h2 className="font-display text-lg text-ink">{SUBJECT_BY_ID.get(sid)?.name}</h2>
                  <div className="grid gap-3">
                    {list.map((b) => (
                      <BookCard key={b.id} book={b} selected={bookIds.includes(b.id)} onToggle={() => toggleBook(b)} />
                    ))}
                  </div>
                </div>
              );
            })}
            <Notice tone="info" title="Kitabın listede yok mu?">
              Özel yayınevi veya farklı bir kitap kullanıyorsan, notlarını yazabilir ya da PDF/fotoğraf olarak yükleyebilirsin; açıklamalar ve sınavlar o materyale dayanır.
            </Notice>
          </section>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 flex items-center justify-between gap-3 border-t border-line bg-bg/90 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        <button className="btn btn-ghost" onClick={() => (step === 0 ? (editing ? router.back() : null) : setStep(step - 1))} disabled={step === 0 && !editing}>
          <ArrowLeft size={18} /> {step === 0 && editing ? "Vazgeç" : "Geri"}
        </button>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Devam <ArrowRight size={18} />
          </button>
        ) : (
          <button className="btn btn-primary" disabled={busy} onClick={finish}>
            <Library size={18} /> {editing ? "Kaydet" : "Başla"}
          </button>
        )}
      </div>
    </div>
  );
}

function OnboardingGate() {
  const { profile, profileLoading } = useApp();
  const params = useSearchParams();
  const editing = Boolean(params.get("duzenle"));
  if (editing && profileLoading) return null;
  const initial = editing ? profile : null;
  return <Onboarding key={initial ? "edit" : "new"} initial={initial} />;
}

export default function WelcomePage() {
  return (
    <Suspense fallback={null}>
      <OnboardingGate />
    </Suspense>
  );
}
