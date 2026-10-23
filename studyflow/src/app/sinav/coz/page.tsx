"use client";

import clsx from "clsx";
import { ArrowLeft, ArrowRight, Check, Flag, LayoutGrid, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { QuestionMeta } from "@/components/QuestionMeta";
import { ConfirmSheet, ProgressBar, Sheet, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/app";
import { subjectName } from "@/lib/catalog/data";
import { isCorrect } from "@/lib/memory/insights";
import { playTone } from "@/lib/sound";
import { useRecord, useStoreCtx } from "@/lib/store/provider";
import type { ExamRecord } from "@/lib/types";

type Answers = Record<string, number | string | null>;
interface Saved {
  answers: Answers;
  flags: string[];
  idx: number;
  startedAt: number;
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

function Solve() {
  const params = useSearchParams();
  const id = params.get("id");
  const instant = params.get("anlik") === "1";
  const { item, loading } = useRecord("exam", id);
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!item)
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Sınav bulunamadı</p>
        <Link href="/sinav" className="btn btn-secondary mt-5">
          Sınavlara dön
        </Link>
      </div>
    );
  return <Runner exam={item} instant={instant} />;
}

function Runner({ exam, instant }: { exam: ExamRecord; instant: boolean }) {
  const router = useRouter();
  const { toast } = useApp();
  const { create } = useStoreCtx();
  const key = `sf-exam-${exam.id}`;
  const qs = exam.questions;
  const [state, setState] = useState<Saved>(() => {
    try {
      const raw = sessionStorage.getItem(key);
      if (raw) return JSON.parse(raw) as Saved;
    } catch {
      /* oturum belleği yoksa yeni başla */
    }
    return { answers: {}, flags: [], idx: 0, startedAt: Date.now() };
  });
  const [now, setNow] = useState(() => Date.now());
  const [map, setMap] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [leave, setLeave] = useState(false);
  const finishing = useRef(false);

  const total = exam.timeLimitMin ? exam.timeLimitMin * 60 : null;
  const elapsed = Math.floor((now - state.startedAt) / 1000);
  const left = total ? Math.max(0, total - elapsed) : null;
  const q = qs[state.idx];
  const answered = qs.filter((x) => state.answers[x.id] !== undefined && state.answers[x.id] !== null && state.answers[x.id] !== "").length;

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* yok say */
    }
  }, [key, state]);
  useEffect(() => {
    if (!total) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [total]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (answered > 0 && !finishing.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [answered]);

  const finish = useCallback(
    async (auto = false) => {
      if (finishing.current) return;
      finishing.current = true;
      const finishedAt = Date.now();
      try {
        const rec = await create("attempt", {
          examId: exam.id,
          examTitle: exam.title,
          startedAt: state.startedAt,
          finishedAt,
          durationSec: Math.round((finishedAt - state.startedAt) / 1000),
          timed: Boolean(total),
          answers: Object.fromEntries(qs.map((x) => [x.id, state.answers[x.id] ?? null])),
          rubricHits: {},
          questions: qs,
        });
        const auto_ = qs.filter((x) => isCorrect(x, state.answers[x.id]) !== null);
        const correct = auto_.filter((x) => isCorrect(x, state.answers[x.id]) === true).length;
        await create("event", { type: "exam", at: finishedAt, subjectId: exam.subjectIds[0] ?? null, topicId: exam.topicIds[0] ?? null, refId: rec.id, correct, total: auto_.length });
        try {
          sessionStorage.removeItem(key);
        } catch {
          /* yok say */
        }
        playTone("done");
        if (auto) toast("Süre doldu; cevapların kaydedildi.", "info");
        router.replace(`/sinav/sonuc?deneme=${rec.id}`);
      } catch {
        finishing.current = false;
        toast("Sonuçlar kaydedilemedi. Tekrar dene; cevapların bu sayfada duruyor.", "error");
      }
    },
    [create, exam, qs, state, total, key, router, toast],
  );

  useEffect(() => {
    if (left === 0 && !finishing.current) void finish(true);
  }, [left, finish]);

  const set = (v: number | string | null) => setState((s) => ({ ...s, answers: { ...s.answers, [q.id]: v } }));
  const go = (i: number) => setState((s) => ({ ...s, idx: Math.max(0, Math.min(qs.length - 1, i)) }));
  const flagged = state.flags.includes(q.id);
  const ans = state.answers[q.id];
  const revealed = instant && (q.type === "mcq" || q.type === "truefalse") && typeof ans === "number";
  const warnLow = left !== null && left <= 60;

  const unansweredIdx = useMemo(() => qs.map((x, i) => (state.answers[x.id] === undefined || state.answers[x.id] === null || state.answers[x.id] === "" ? i : -1)).filter((i) => i >= 0), [qs, state.answers]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <button className="btn btn-ghost btn-sm -ml-2" onClick={() => (answered ? setLeave(true) : router.push("/sinav"))}>
          <X size={17} /> Çık
        </button>
        <div className="flex items-center gap-3 text-sm">
          {left !== null && (
            <span className={clsx("rounded-full px-3 py-1 font-semibold tabular-nums", warnLow ? "bg-warn-soft text-warn" : "bg-surface-2 text-ink-2")} role="timer" aria-label="Kalan süre">
              {fmt(left)}
            </span>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setMap(true)}>
            <LayoutGrid size={16} /> {state.idx + 1}/{qs.length}
          </button>
        </div>
      </div>
      <ProgressBar value={(state.idx + 1) / qs.length} label="Sınav ilerlemesi" />
      <p className="mb-6 mt-3 text-[13px] text-ink-3">
        {exam.title} · {answered} soru cevaplandı
      </p>

      <article key={q.id} className="anim-rise space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="eyebrow">
            Soru {state.idx + 1} · {subjectName(q.subjectId)}
          </span>
          <QuestionMeta q={q} compact />
        </div>
        <div className="text-[1.08rem] leading-relaxed text-ink">
          <Markdown>{q.stem}</Markdown>
        </div>

        {(q.type === "mcq" || q.type === "truefalse") && (
          <div className="grid gap-2.5" role="radiogroup" aria-label="Seçenekler">
            {q.choices!.map((c, i) => {
              const chosen = ans === i;
              const isAns = i === q.answerIndex;
              return (
                <button
                  key={i}
                  role="radio"
                  aria-checked={chosen}
                  disabled={revealed}
                  onClick={() => (set(i), playTone("tap"))}
                  className={clsx(
                    "flex items-start gap-3.5 rounded-2xl border px-4 py-3.5 text-left text-[1rem] leading-snug transition-colors",
                    !revealed && (chosen ? "border-accent bg-accent-soft" : "border-line-strong bg-raised hover:bg-surface-2"),
                    revealed && isAns && "border-ok/60 bg-ok-soft",
                    revealed && chosen && !isAns && "border-warn/60 bg-warn-soft",
                    revealed && !chosen && !isAns && "border-line bg-raised opacity-60",
                  )}
                >
                  <span className={clsx("mt-px grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[12px] font-bold", chosen && !revealed ? "border-accent bg-accent text-accent-ink" : "border-line-strong text-ink-3")}>{String.fromCharCode(65 + i)}</span>
                  <span className="min-w-0 flex-1">
                    <Markdown>{c}</Markdown>
                  </span>
                  {revealed && isAns && <Check size={18} className="mt-0.5 shrink-0 text-ok" />}
                </button>
              );
            })}
          </div>
        )}
        {q.type === "short" && (
          <input className="field" placeholder="Cevabını yaz" value={typeof ans === "string" ? ans : ""} onChange={(e) => set(e.target.value)} aria-label="Kısa cevap" maxLength={300} />
        )}
        {q.type === "written" && (
          <textarea className="field min-h-[180px]" placeholder="Cevabını buraya yaz…" value={typeof ans === "string" ? ans : ""} onChange={(e) => set(e.target.value)} aria-label="Yazılı cevap" maxLength={4000} />
        )}

        {revealed && (
          <div className="anim-rise space-y-2 rounded-2xl bg-surface-2 px-4 py-3.5 text-[0.95rem] leading-relaxed text-ink-2">
            <p className="font-semibold text-ink">{ans === q.answerIndex ? "Doğru." : `Doğru cevap: ${String.fromCharCode(65 + (q.answerIndex ?? 0))}`}</p>
            <Markdown>{q.explanation}</Markdown>
          </div>
        )}
      </article>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button className="btn btn-secondary" onClick={() => go(state.idx - 1)} disabled={state.idx === 0}>
          <ArrowLeft size={17} /> Önceki
        </button>
        <button className={clsx("btn btn-ghost btn-sm", flagged && "text-brass")} onClick={() => setState((s) => ({ ...s, flags: flagged ? s.flags.filter((f) => f !== q.id) : [...s.flags, q.id] }))} aria-pressed={flagged}>
          <Flag size={16} fill={flagged ? "currentColor" : "none"} /> {flagged ? "İşaretli" : "İşaretle"}
        </button>
        {state.idx < qs.length - 1 ? (
          <button className="btn btn-primary" onClick={() => go(state.idx + 1)}>
            Sonraki <ArrowRight size={17} />
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => (unansweredIdx.length ? setConfirm(true) : void finish())}>
            Bitir
          </button>
        )}
      </div>
      {state.idx < qs.length - 1 && (
        <div className="mt-4 text-center">
          <button className="text-sm text-ink-3 underline-offset-4 hover:text-ink hover:underline" onClick={() => (unansweredIdx.length ? setConfirm(true) : void finish())}>
            Sınavı şimdi bitir
          </button>
        </div>
      )}

      <Sheet open={map} onClose={() => setMap(false)} title="Sorular">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
          {qs.map((x, i) => {
            const a = state.answers[x.id];
            const done = a !== undefined && a !== null && a !== "";
            return (
              <button
                key={x.id}
                onClick={() => (go(i), setMap(false))}
                aria-label={`Soru ${i + 1}${done ? ", cevaplandı" : ""}${state.flags.includes(x.id) ? ", işaretli" : ""}`}
                className={clsx(
                  "relative grid h-11 place-items-center rounded-xl border text-sm font-semibold tabular-nums",
                  i === state.idx ? "border-accent bg-accent text-accent-ink" : done ? "border-accent/40 bg-accent-soft text-accent" : "border-line-strong text-ink-2",
                )}
              >
                {i + 1}
                {state.flags.includes(x.id) && <Flag size={10} className="absolute right-1 top-1 text-brass" fill="currentColor" />}
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex justify-end">
          <button className="btn btn-primary btn-sm" onClick={() => (setMap(false), unansweredIdx.length ? setConfirm(true) : void finish())}>
            Sınavı bitir
          </button>
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirm}
        title="Sınavı bitirelim mi?"
        text={`${unansweredIdx.length} soruyu boş bıraktın. Bitirirsen boş sorular yanlış sayılmaz; sonuçta "boş" görünür.`}
        confirmLabel="Evet, bitir"
        onClose={() => setConfirm(false)}
        onConfirm={() => void finish()}
      />
      <ConfirmSheet
        open={leave}
        title="Çıkmak istiyor musun?"
        text="Cevapların bu cihazda geçici olarak saklanır; aynı sınava geri dönersen kaldığın yerden devam edebilirsin."
        confirmLabel="Çık"
        onClose={() => setLeave(false)}
        onConfirm={() => {
          finishing.current = true;
          router.push("/sinav");
        }}
      />
    </div>
  );
}

export default function SolvePage() {
  return (
    <Suspense fallback={null}>
      <Solve />
    </Suspense>
  );
}
