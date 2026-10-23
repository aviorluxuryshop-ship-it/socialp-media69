"use client";

import { ArrowLeft, BadgeCheck, Check, ClipboardCheck, ExternalLink, Play, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { QuizCard, type QuizItem } from "@/components/QuizCard";
import { Notice, Spinner } from "@/components/ui";
import { errorText, useAi, useServerStatus } from "@/lib/ai/client";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { getBook, resolveTopic, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { formatDay } from "@/lib/dates";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { Question } from "@/lib/types";
import { formatDuration, STYLE_LABEL, thumb, VIDEO_BY_ID, videosForTopic, youtubeUrl } from "@/lib/videos";

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>();
  const v = VIDEO_BY_ID.get(id);
  const { profile, toast } = useApp();
  const auth = useAuth();
  const status = useServerStatus();
  const ai = useAi();
  const { create, update } = useStoreCtx();
  const states = useRecords("video", { limit: 300 });
  const [play, setPlay] = useState(false);
  const [quiz, setQuiz] = useState<{ items: QuizItem[]; picked: (number | null)[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const state = states.items.find((s) => s.videoId === id);
  const related = useMemo(() => (v ? videosForTopic(v.topicIds[0]).filter((x) => x.id !== v.id).slice(0, 4) : []), [v]);
  if (!v) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Video kataloğumuzda yok</p>
        <p className="mt-1 text-ink-3">Yalnızca doğrulanmış videoları gösteriyoruz.</p>
        <Link href="/video" className="btn btn-secondary mt-5">
          Videolara dön
        </Link>
      </div>
    );
  }
  const aiOn = Boolean(status?.aiReady) && (!status?.accounts || auth.status === "signed-in");
  const topicId = v.topicIds[0];
  const bookIds = (profile?.bookIds ?? []).filter((b) => getBook(b)?.subjectId === v.subjectId);

  async function markWatched(watched: boolean) {
    try {
      if (state) await update("video", state.id, { watched, lastOpenedAt: Date.now() });
      else await create("video", { videoId: v!.id, watched, lastOpenedAt: Date.now() });
      if (watched) {
        playTone("success");
        await create("event", { type: "video", at: Date.now(), subjectId: v!.subjectId, topicId, refId: v!.id, minutes: Math.round(v!.durationSec / 60) });
      }
    } catch {
      toast("Kaydedilemedi.", "error");
    }
  }

  async function runQuiz() {
    if (!profile) return;
    setBusy(true);
    try {
      const r = await ai.postJson<{ questions: Question[] }>("/api/ai/quiz", { grade: profile.grade, subjectId: v!.subjectId, topicId, query: topicLabel(topicId), bookIds, count: 3 });
      setQuiz({ items: r.questions.map((q) => ({ stem: q.stem, choices: q.choices ?? [], answerIndex: q.answerIndex ?? 0, explanation: q.explanation })), picked: r.questions.map(() => null) });
    } catch (e) {
      toast(errorText(e), "error");
    }
    setBusy(false);
  }

  async function pick(qi: number, ci: number) {
    if (!quiz) return;
    const picked = quiz.picked.map((p, i) => (i === qi ? ci : p));
    setQuiz({ ...quiz, picked });
    if (picked.every((p) => p !== null)) {
      const correct = picked.filter((p, i) => p === quiz.items[i].answerIndex).length;
      playTone(correct === picked.length ? "done" : "soft");
      try {
        if (state) await update("video", state.id, { quizScore: { correct, total: picked.length }, watched: true });
        else await create("video", { videoId: v!.id, watched: true, quizScore: { correct, total: picked.length }, lastOpenedAt: Date.now() });
        await create("event", { type: "exam", at: Date.now(), subjectId: v!.subjectId, topicId, correct, total: picked.length });
      } catch {
        /* sessizce geç */
      }
    }
  }

  return (
    <div>
      <Link href="/video" className="btn btn-ghost btn-sm -ml-2 mb-4">
        <ArrowLeft size={17} /> Videolar
      </Link>
      <div className="mx-auto max-w-3xl">
        <div className="relative aspect-video overflow-hidden rounded-[var(--radius-card)] border border-line bg-black shadow-[var(--shadow-2)]">
          {play ? (
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&modestbranding=1&hl=tr`}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button className="group absolute inset-0 h-full w-full" onClick={() => setPlay(true)} aria-label="Videoyu oynat">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(v.id)} alt="" className="h-full w-full object-cover opacity-90" referrerPolicy="no-referrer" />
              <span className="absolute inset-0 grid place-items-center bg-black/25 transition-colors group-hover:bg-black/35">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-accent shadow-lg">
                  <Play size={26} fill="currentColor" />
                </span>
              </span>
            </button>
          )}
        </div>
        <p className="mt-2 text-[12.5px] text-ink-3">Oynat dediğinde video YouTube&apos;un gizlilik gömmesiyle (youtube-nocookie.com) yüklenir.</p>

        <h1 className="mt-5 font-display text-[1.55rem] leading-snug text-ink sm:text-[1.9rem]">{v.title.replace(/\s*\|\s*/g, " · ")}</h1>
        <p className="mt-2 text-ink-2">
          <a href={`https://www.youtube.com/channel/${v.channelId}`} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-accent hover:underline">
            {v.channel}
          </a>{" "}
          · {formatDuration(v.durationSec)} · {formatDay(v.publishedAt)} {v.publishedAt.slice(0, 4)}
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="badge badge-accent">{subjectName(v.subjectId)}</span>
          {v.styles.map((s) => (
            <span key={s} className="badge">
              {STYLE_LABEL[s]}
            </span>
          ))}
          <span className="badge badge-ok" title="YouTube'da mevcut, gömülebilir, künye eşleşti">
            <BadgeCheck size={12} /> Doğrulandı {formatDay(v.verifiedAt)}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <button className={state?.watched ? "btn btn-primary" : "btn btn-secondary"} aria-pressed={Boolean(state?.watched)} onClick={() => void markWatched(!state?.watched)}>
            <Check size={17} /> {state?.watched ? "İzledim" : "İzledim olarak işaretle"}
          </button>
          <button className="btn btn-secondary" onClick={() => void runQuiz()} disabled={!aiOn || busy} title={aiOn ? undefined : "Yapay zekâ şu an kullanılamıyor"}>
            {busy ? <Spinner size={16} /> : <ClipboardCheck size={17} />} Kısa test
          </button>
          <Link href={`/ogren?konu=${topicId}`} className="btn btn-ghost">
            <Sparkles size={17} /> Konuyu yazıyla anlat
          </Link>
          <a href={youtubeUrl(v.id)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <ExternalLink size={16} /> YouTube&apos;da aç
          </a>
        </div>
        {!aiOn && <p className="mt-2 text-[13px] text-ink-3">Kısa test, yapay zekâ gerektirir; video izlemek için gerekmez.</p>}

        <section className="mt-8">
          <h2 className="mb-2 font-display text-lg text-ink">Hangi kitap konusuna denk geliyor?</h2>
          <ul className="space-y-1.5 text-[0.95rem]">
            {v.topicIds.map((t) => {
              const r = resolveTopic(t);
              return (
                <li key={t} className="text-ink-2">
                  {r && (
                    <>
                      <Link href={`/kitaplarim/${r.book.id}`} className="text-accent underline-offset-4 hover:underline">
                        {r.book.title.replace(/\.Sınıf/, ". sınıf")}
                      </Link>{" "}
                      · {topicLabel(t)} · s. {r.pages[0]}–{r.pages[1]}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-[12.5px] text-ink-3">Eşleşme editoryaldır; videoyu izlerken kitabındaki ilgili sayfayla karşılaştır.</p>
        </section>

        {quiz && (
          <div className="mt-8">
            <QuizCard items={quiz.items} picked={quiz.picked} onPick={(qi, ci) => void pick(qi, ci)} title="Video sonrası kısa kontrol" />
            <p className="mt-2 text-[12.5px] text-ink-3">Sorular yapay zekâ ürettiği sorulardır ve konu başlığına/kitap sayfalarına dayanır; videonun içeriğini ölçmez.</p>
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 font-display text-lg text-ink">Aynı konudan başka anlatımlar</h2>
            <ul className="card hair overflow-hidden">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/video/${r.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-1 block text-[0.95rem] text-ink">{r.title.replace(/\s*\|\s*/g, " · ")}</span>
                      <span className="block text-[13px] text-ink-3">
                        {r.channel} · {formatDuration(r.durationSec)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        <div className="mt-8">
          <Notice tone="info">Videolar üçüncü taraf eğitmenlere aittir ve kendi sitelerinde/YouTube&apos;da yayımlanır; StudyFlow bunları indirmez veya yeniden dağıtmaz.</Notice>
        </div>
      </div>
    </div>
  );
}
