"use client";

import clsx from "clsx";
import { BadgeCheck, BookOpen, ChevronDown, History, Paperclip, Plus, SendHorizontal, Square, TriangleAlert, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MaterialPicker, type PickedMaterial } from "@/components/MaterialPicker";
import { Markdown } from "@/components/Markdown";
import { QuizCard } from "@/components/QuizCard";
import { TopicPicker } from "@/components/TopicPicker";
import { Notice, Segmented, Sheet, Thinking } from "@/components/ui";
import { errorText, useAi, useServerStatus } from "@/lib/ai/client";
import type { Material, TutorAction } from "@/lib/ai/types";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { getBook, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { uid } from "@/lib/ids";
import { noteText, uploadText } from "@/lib/materials";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import { nowMs, timeAgo } from "@/lib/dates";
import type { ChatMessage, ChatRecord, MiniQuiz, Question, SourceRef, TutorMode } from "@/lib/types";

const MODES: { value: TutorMode; label: string; hint: string }[] = [
  { value: "hizli", label: "Hızlı Anlat", hint: "Çekirdek fikir, kısa ve net" },
  { value: "konu", label: "Konuyu Öğren", hint: "Ana fikir, neden, örnek, dikkat" },
  { value: "derin", label: "Derinlemesine Anla", hint: "Sezgiden gerekçeye katmanlı anlatım" },
];

const ACTIONS: { id: TutorAction | "test"; label: string }[] = [
  { id: "simple", label: "Daha basit anlat" },
  { id: "example", label: "Örnek göster" },
  { id: "steps", label: "Adım adım çöz" },
  { id: "compare", label: "Aralarındaki farkı açıkla" },
  { id: "test", label: "Beni test et" },
  { id: "other", label: "Başka şekilde anlat" },
];

const GROUND_BADGE = {
  textbook: { tone: "badge-ok", text: "Resmî ders kitabına dayalı" },
  "user-material": { tone: "badge-accent", text: "Kendi materyaline dayalı" },
  mixed: { tone: "badge-ok", text: "Kitap ve materyale dayalı" },
  general: { tone: "badge-warn", text: "Genel müfredat bilgisi (kitap dışı)" },
} as const;

function Tutor() {
  const { profile, toast } = useApp();
  const auth = useAuth();
  const status = useServerStatus();
  const ai = useAi();
  const { create, update } = useStoreCtx();
  const params = useSearchParams();
  const chats = useRecords("chat", { limit: 30 });
  const notes = useRecords("note", { limit: 200 });
  const uploads = useRecords("upload", { limit: 200 });

  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [mode, setMode] = useState<TutorMode>("hizli");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [pickTopic, setPickTopic] = useState(false);
  const [pickMat, setPickMat] = useState(false);
  const [history, setHistory] = useState(false);
  const [mats, setMats] = useState<PickedMaterial[]>([]);
  const [labels, setLabels] = useState<Record<string, Record<string, SourceRef>>>({});
  const [errorFor, setErrorFor] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const query = useRef<string>("");
  const created = useRef(false);

  const subjects = profile?.subjectIds ?? [];
  const subj = subjectId ?? subjects[0] ?? null;
  const bookIds = useMemo(() => (profile?.bookIds ?? []).filter((id) => getBook(id)?.subjectId === subj), [profile?.bookIds, subj]);

  function openChat(c: ChatRecord) {
    abort.current?.abort();
    setChatId(c.id);
    setMessages(c.messages);
    setSubjectId(c.subjectId);
    setTopicId(c.topicId);
    setMode(c.mode);
    created.current = true;
    query.current = c.messages.find((m) => m.role === "user")?.content ?? "";
    setHistory(false);
  }
  function newChat() {
    abort.current?.abort();
    setChatId(null);
    setMessages([]);
    setBusy(false);
    setPhase(null);
    created.current = false;
    query.current = "";
  }

  // URL parametreleri: ?konu=…  ?ders=…  ?sohbet=…  ?not=…  ?yukleme=…
  const urlKey = params.toString();
  const applied = useRef("");
  useEffect(() => {
    if (!profile || applied.current === urlKey) return;
    applied.current = urlKey;
    const konu = params.get("konu");
    const ders = params.get("ders");
    if (konu) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- adres çubuğundaki parametrelerle bir kez ön doldurma
      setTopicId(konu);
      const b = getBook(Number(konu.match(/^b(\d+)-/)?.[1]));
      if (b) setSubjectId(b.subjectId);
    } else if (ders) setSubjectId(ders);
    const notId = params.get("not");
    const upId = params.get("yukleme");
    if (notId) {
      const n = notes.items.find((x) => x.id === notId);
      if (n) setMats([{ type: "note", id: n.id, title: n.title || "Not" }]);
    }
    if (upId) {
      const u = uploads.items.find((x) => x.id === upId);
      if (u) setMats([{ type: "upload", id: u.id, title: u.name }]);
    }
    const sohbet = params.get("sohbet");
    if (sohbet) {
      const c = chats.items.find((x) => x.id === sohbet);
      if (c) openChat(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, urlKey, notes.items, uploads.items, chats.items]);

  const lastLen = messages.at(-1)?.content.length;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, lastLen]);

  const materialPayload = useCallback((): Material[] => {
    return mats.flatMap((m): Material[] => {
      if (m.type === "note") {
        const n = notes.items.find((x) => x.id === m.id);
        return n ? [{ title: m.title, text: noteText(n).slice(0, 6000), recordId: n.id, type: "note" as const }] : [];
      }
      const u = uploads.items.find((x) => x.id === m.id);
      return u ? [{ title: m.title, text: uploadText(u).slice(0, 6000), recordId: u.id, type: "upload" as const }] : [];
    });
  }, [mats, notes.items, uploads.items]);

  async function persist(list: ChatMessage[], matchedTopic: string | null) {
    const title = (list.find((m) => m.role === "user")?.content ?? "Sohbet").slice(0, 70);
    const data = { title, subjectId: subj, topicId: matchedTopic ?? topicId, mode, messages: list };
    if (!created.current) {
      created.current = true;
      const id = chatId ?? uid();
      setChatId(id);
      await create("chat", data, id);
    } else if (chatId) {
      await update("chat", chatId, data);
    }
  }

  async function send(text: string, opts?: { action?: TutorAction; mode?: TutorMode; asNewQuestion?: boolean }) {
    const trimmed = text.trim();
    if (!trimmed || busy || !profile) return;
    const useMode = opts?.mode ?? mode;
    if (!opts?.action && !opts?.mode) query.current = trimmed;
    if (!query.current) query.current = trimmed;
    const userMsg: ChatMessage = { id: uid(), role: "user", content: trimmed, at: nowMs() };
    const asstId = uid();
    const asst: ChatMessage = { id: asstId, role: "assistant", content: "", at: nowMs(), mode: useMode };
    const history = [...messages, userMsg];
    setMessages([...history, asst]);
    setInput("");
    setBusy(true);
    setPhase("Düşünüyor");
    const ctl = new AbortController();
    abort.current = ctl;
    let content = "";
    let meta: Pick<ChatMessage, "sources" | "grounding" | "groundingNote"> = {};
    let matched: string | null = null;
    let failed: string | null = null;
    const patch = (p: Partial<ChatMessage>) => setMessages((cur) => cur.map((m) => (m.id === asstId ? { ...m, ...p } : m)));
    try {
      await ai.streamTutor(
        {
          messages: history.slice(-9).map((m) => ({ role: m.role, content: m.content })),
          query: query.current,
          mode: useMode,
          action: opts?.action ?? null,
          grade: profile.grade,
          subjectId: subj,
          topicId,
          bookIds,
          materials: materialPayload(),
        },
        (e) => {
          if (e.t === "status") setPhase(e.x);
          else if (e.t === "meta") {
            matched = e.topicId;
            meta = { sources: Object.values(e.labels), grounding: e.grounding, groundingNote: e.note ?? undefined };
            patch(meta);
            setLabels((l) => ({ ...l, [asstId]: e.labels }));
          } else if (e.t === "delta") {
            content += e.x;
            setPhase(null);
            patch({ content });
          } else if (e.t === "error") failed = e.message;
          else if (e.t === "done" && e.truncated) {
            content += "\n\n*(Yanıt uzunluk sınırında kesildi. “Devam et” yazabilirsin.)*";
            patch({ content });
          }
        },
        ctl.signal,
      );
    } catch (e) {
      failed = errorText(e);
    }
    setBusy(false);
    setPhase(null);
    if (failed && !content) {
      patch({ content: "", groundingNote: failed });
      setErrorFor(asstId);
      setErrorMsg(failed);
      return;
    }
    if (failed) toast(failed, "error");
    const finalList = [...history, { ...asst, ...meta, content, mode: useMode }];
    setMessages(finalList);
    playTone("soft");
    try {
      await persist(finalList, matched);
      await create("event", { type: "tutor", at: nowMs(), subjectId: subj, topicId: matched ?? topicId, refId: chatId ?? undefined });
    } catch {
      toast("Sohbet kaydedilemedi, ama yanıt ekranda duruyor.", "error");
    }
  }

  async function runQuiz(asstIndex: number) {
    if (busy || !profile || !subj) return;
    setBusy(true);
    setPhase("Sana uygun kısa bir test hazırlanıyor");
    try {
      const r = await ai.postJson<{ questions: Question[]; note: string | null }>("/api/ai/quiz", {
        grade: profile.grade,
        subjectId: subj,
        topicId,
        query: query.current,
        bookIds,
        count: 3,
        materials: materialPayload().slice(0, 2),
      });
      const quiz: MiniQuiz = {
        items: r.questions.map((q) => ({ stem: q.stem, choices: q.choices ?? [], answerIndex: q.answerIndex ?? 0, explanation: q.explanation })),
        picked: r.questions.map(() => null),
      };
      const list = messages.map((m, i) => (i === asstIndex ? { ...m, quiz } : m));
      setMessages(list);
      await persist(list, null);
    } catch (e) {
      toast(errorText(e), "error");
    }
    setBusy(false);
    setPhase(null);
  }

  async function pickQuiz(mi: number, qi: number, ci: number) {
    const list = messages.map((m, i) => {
      if (i !== mi || !m.quiz) return m;
      const picked = m.quiz.picked.map((p, k) => (k === qi ? ci : p));
      return { ...m, quiz: { ...m.quiz, picked } };
    });
    setMessages(list);
    const q = list[mi].quiz;
    if (q && q.picked.every((p) => p !== null)) {
      const correct = q.picked.filter((p, k) => p === q.items[k].answerIndex).length;
      playTone(correct === q.items.length ? "done" : "soft");
      await create("event", { type: "exam", at: nowMs(), subjectId: subj, topicId, correct, total: q.items.length });
    }
    try {
      await persist(list, null);
    } catch {
      /* sessizce geç */
    }
  }

  if (!profile) return null;
  const aiState = !status ? "loading" : !status.aiReady ? (status.ai ? "noaccounts" : "off") : status.accounts && auth.status !== "signed-in" ? "login" : "ready";
  const canSend = aiState === "ready" && !busy && input.trim().length > 0;
  const lastAsstIdx = messages.map((m) => m.role).lastIndexOf("assistant");
  const topicName = topicId ? topicLabel(topicId) : null;

  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col lg:min-h-[calc(100dvh-8rem)]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Yapay Zekâ ile Öğren</p>
          <h1 className="font-display text-[1.9rem] leading-tight text-ink sm:text-[2.3rem]">Ne öğrenmek istersin?</h1>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setHistory(true)}>
            <History size={17} /> Geçmiş
          </button>
          <button className="btn btn-secondary btn-sm" onClick={newChat} disabled={!messages.length}>
            <Plus size={17} /> Yeni sohbet
          </button>
        </div>
      </header>

      {aiState === "off" && (
        <div className="mb-4">
          <Notice tone="warn" title="Yapay zekâ bu sürümde henüz etkin değil">
            Açıklama ve test üretimi için sunucuda yapay zekâ anahtarının tanımlanması gerekiyor. Notlar, plan, video ve kitap bölümleri bundan bağımsız çalışır.
          </Notice>
        </div>
      )}
      {aiState === "noaccounts" && (
        <div className="mb-4">
          <Notice tone="warn" title="Yapay zekâ henüz açılmadı">
            Anahtarı kötüye kullanıma karşı korumak için yapay zekâ, hesap sistemi yapılandırılmadan açılmaz.
          </Notice>
        </div>
      )}
      {aiState === "login" && (
        <div className="mb-4">
          <Notice
            tone="info"
            title="Yapay zekâ için giriş yap"
            action={
              <Link href="/giris" className="btn btn-primary btn-sm">
                Giriş yap
              </Link>
            }
          >
            Kullanım sınırlarını ve gizliliğini korumak için yapay zekâ özellikleri hesap gerektirir.
          </Notice>
        </div>
      )}

      {/* Bağlam çubuğu */}
      <section className="card mb-5 space-y-3.5 p-4" aria-label="Çalışma bağlamı">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Ders</span>
            <select
              className="field"
              value={subj ?? ""}
              onChange={(e) => {
                setSubjectId(e.target.value || null);
                setTopicId(null);
              }}
            >
              {subjects.map((s) => (
                <option key={s} value={s}>
                  {subjectName(s)}
                </option>
              ))}
            </select>
          </label>
          <div>
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Konu</span>
            <button className="field flex items-center justify-between gap-2 text-left" onClick={() => setPickTopic(true)}>
              <span className={clsx("truncate", !topicName && "text-ink-3")}>{topicName ?? "Konu seç (isteğe bağlı)"}</span>
              <ChevronDown size={17} className="shrink-0 text-ink-3" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented value={mode} onChange={setMode} options={MODES} label="Anlatım modu" size="sm" />
          <button className="btn btn-ghost btn-sm" onClick={() => setPickMat(true)}>
            <Paperclip size={16} /> Materyal ekle{mats.length ? ` (${mats.length})` : ""}
          </button>
        </div>
        {mats.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mats.map((m) => (
              <span key={m.id} className="badge badge-accent gap-1.5 py-1">
                {m.title}
                <button aria-label={`${m.title} materyalini kaldır`} onClick={() => setMats(mats.filter((x) => x.id !== m.id))}>
                  <X size={13} />
                </button>
              </span>
            ))}
          </div>
        )}
        {subj && bookIds.length === 0 && (
          <p className="flex items-start gap-2 text-[13px] leading-snug text-ink-3">
            <BookOpen size={15} className="mt-0.5 shrink-0" />
            <span>
              Bu ders için kitap seçmedin; açıklamalar genel müfredata dayanır.{" "}
              <Link href="/kitaplarim" className="text-accent underline-offset-4 hover:underline">
                Kitap seç
              </Link>
            </span>
          </p>
        )}
      </section>

      {/* Konuşma */}
      <div className="flex-1 space-y-6" aria-live="polite">
        {messages.length === 0 && (
          <div className="card px-5 py-9 text-center sm:px-8">
            <h2 className="font-display text-xl text-ink">{topicName ? "Bu konuyla başlayalım" : "Bir soru yaz ya da konu seç"}</h2>
            <p className="mx-auto mt-2 max-w-md text-[0.95rem] leading-relaxed text-ink-3">
              Önce kısa ve net bir açıklama alırsın. Daha fazlasını istersen altındaki düğmelerle derinleştirirsin.
            </p>
            {topicName && (
              <button className="btn btn-primary mt-5" disabled={aiState !== "ready"} onClick={() => void send(`${topicName} konusunu anlat.`)}>
                Bu konuyu anlat
              </button>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={m.id} className={clsx("anim-rise", m.role === "user" ? "flex justify-end" : "")}>
            {m.role === "user" ? (
              <div className="max-w-[88%] rounded-2xl rounded-br-md bg-accent-soft px-4 py-3 text-[0.97rem] leading-relaxed text-ink">{m.content}</div>
            ) : (
              <article className="space-y-3">
                {m.grounding && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={clsx("badge", GROUND_BADGE[m.grounding].tone)}>
                      {m.grounding === "general" ? <TriangleAlert size={12} /> : <BadgeCheck size={12} />}
                      {GROUND_BADGE[m.grounding].text}
                    </span>
                    {m.mode && <span className="badge">{MODES.find((x) => x.value === m.mode)?.label}</span>}
                  </div>
                )}
                {m.groundingNote && !(errorFor === m.id) && <p className="text-[13px] leading-snug text-ink-3">{m.groundingNote}</p>}
                {m.content ? (
                  <Markdown cites={labels[m.id] ?? Object.fromEntries((m.sources ?? []).map((s, k) => [(s.type === "textbook" ? "K" : "M") + (k + 1), s]))}>{m.content}</Markdown>
                ) : errorFor === m.id ? (
                  <Notice
                    tone="error"
                    title="Yanıt alınamadı"
                    action={
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const prev = messages[i - 1];
                          setMessages(messages.slice(0, i - 1));
                          setErrorFor(null);
                          if (prev) void send(prev.content);
                        }}
                      >
                        Tekrar dene
                      </button>
                    }
                  >
                    {errorMsg}
                  </Notice>
                ) : (
                  <Thinking label={phase ?? "Düşünüyor"} />
                )}
                {m.sources && m.sources.length > 0 && m.content && (
                  <details className="group text-sm">
                    <summary className="cursor-pointer list-none text-ink-3 hover:text-ink">
                      <span className="underline-offset-4 group-open:underline">Kaynaklar ({m.sources.length})</span>
                    </summary>
                    <ul className="mt-2 space-y-1.5">
                      {m.sources.map((s, k) => (
                        <li key={k} className="flex items-baseline gap-2 text-ink-2">
                          <span className="badge shrink-0">{s.type === "textbook" ? `K${k + 1}` : `M${k + 1}`}</span>
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-4 hover:underline">
                              {s.label}
                            </a>
                          ) : (
                            <span>{s.label}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-[12.5px] text-ink-3">Metinler resmî PDF&apos;ten otomatik çıkarıldı; sayfa bağlantısı doğrulanmış kitap sürümüne gider.</p>
                  </details>
                )}
                {m.quiz && <QuizCard items={m.quiz.items} picked={m.quiz.picked} onPick={(qi, ci) => void pickQuiz(i, qi, ci)} />}
                {i === lastAsstIdx && !busy && m.content && (
                  <div className="flex flex-wrap gap-2 pt-1" role="group" aria-label="Sonraki adımlar">
                    {ACTIONS.map((a) => (
                      <button
                        key={a.id}
                        className="chip"
                        disabled={aiState !== "ready"}
                        onClick={() => (a.id === "test" ? void runQuiz(i) : void send(`${a.label}.`, { action: a.id as TutorAction }))}
                      >
                        {a.label}
                      </button>
                    ))}
                    {m.mode !== "derin" && (
                      <button className="chip" disabled={aiState !== "ready"} onClick={() => void send("Derinlemesine anlat.", { mode: "derin", action: undefined })}>
                        Derinlemesine Anla
                      </button>
                    )}
                    {m.mode === "hizli" && (
                      <button className="chip" disabled={aiState !== "ready"} onClick={() => void send("Konuyu öğretici biçimde anlat.", { mode: "konu", action: undefined })}>
                        Konuyu Öğren
                      </button>
                    )}
                  </div>
                )}
              </article>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Yazma alanı */}
      <div className="sticky bottom-[4.6rem] z-20 mt-6 lg:bottom-4">
        <form
          className="card-raised flex items-end gap-2 p-2.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) void send(input);
          }}
        >
          <textarea
            className="field max-h-40 min-h-[46px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus:shadow-none"
            rows={1}
            value={input}
            placeholder={aiState === "ready" ? "Bir şey sor veya bir konuyu yaz…" : "Yapay zekâ şu an kullanılamıyor"}
            disabled={aiState !== "ready"}
            aria-label="Mesajın"
            onChange={(e) => {
              setInput(e.target.value);
              e.currentTarget.style.height = "auto";
              e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 160) + "px";
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (canSend) void send(input);
              }
            }}
          />
          {busy ? (
            <button type="button" className="btn btn-secondary btn-icon" aria-label="Durdur" onClick={() => abort.current?.abort()}>
              <Square size={16} />
            </button>
          ) : (
            <button type="submit" className="btn btn-primary btn-icon" aria-label="Gönder" disabled={!canSend}>
              <SendHorizontal size={18} />
            </button>
          )}
        </form>
      </div>

      <TopicPicker open={pickTopic} onClose={() => setPickTopic(false)} bookIds={bookIds} value={topicId ? [topicId] : []} onChange={(v) => setTopicId(v[0] ?? null)} />
      <MaterialPicker open={pickMat} onClose={() => setPickMat(false)} value={mats} onChange={setMats} />
      <Sheet open={history} onClose={() => setHistory(false)} title="Önceki sohbetler">
        {chats.items.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-3">Henüz sohbet yok.</p>
        ) : (
          <ul className="hair">
            {chats.items.map((c) => (
              <li key={c.id}>
                <button className="flex w-full items-center gap-3 py-3 text-left hover:text-accent" onClick={() => openChat(c)}>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-ink">{c.title}</span>
                    <span className="block truncate text-[13px] text-ink-3">
                      {subjectName(c.subjectId)} · {timeAgo(c.updatedAt)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={null}>
      <Tutor />
    </Suspense>
  );
}
