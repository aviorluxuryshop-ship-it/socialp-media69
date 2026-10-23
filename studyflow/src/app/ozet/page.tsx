"use client";

import clsx from "clsx";
import { BadgeCheck, BookMarked, Check, Layers, Printer, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { SummaryView } from "@/components/SummaryView";
import { TopicPicker } from "@/components/TopicPicker";
import { ConfirmSheet, Notice, PageHeader, Segmented, Spinner } from "@/components/ui";
import { errorText, useAi, useServerStatus } from "@/lib/ai/client";
import { SECTION_META } from "@/lib/ai/summary";
import type { Material } from "@/lib/ai/types";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { getBook, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { timeAgo } from "@/lib/dates";
import { noteText, uploadText, uploadUsable } from "@/lib/materials";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { SourceRef, SummaryContent, SummaryRecord, SummarySection } from "@/lib/types";

type Tab = "topics" | "notes" | "uploads";
const GROUND = {
  textbook: ["badge-ok", "Resmî ders kitabına dayalı"],
  "user-material": ["badge-accent", "Kendi materyaline dayalı"],
  mixed: ["badge-ok", "Kitap ve materyale dayalı"],
  general: ["badge-warn", "Genel müfredat bilgisi (kitap dışı)"],
} as const;

function Summaries() {
  const { profile, toast } = useApp();
  const auth = useAuth();
  const status = useServerStatus();
  const ai = useAi();
  const { create, remove } = useStoreCtx();
  const params = useSearchParams();
  const notes = useRecords("note", { limit: 200 });
  const uploads = useRecords("upload", { limit: 200 });
  const saved = useRecords("summary", { limit: 50 });

  // Başka sayfalardan gelen ?not= / ?yukleme= / ?konu= bağlantıları seçimi önceden doldurur.
  const fromNote = params.get("not");
  const fromUpload = params.get("yukleme");
  const fromTopic = !fromNote && !fromUpload ? params.get("konu") : null;
  const [tab, setTab] = useState<Tab>(fromNote ? "notes" : fromUpload && !fromNote ? "uploads" : "topics");
  const [subject, setSubject] = useState<string | null>(() => (fromTopic ? (getBook(Number(fromTopic.match(/^b(\d+)-/)?.[1]))?.subjectId ?? null) : null));
  const [topicIds, setTopicIds] = useState<string[]>(fromTopic ? [fromTopic] : []);
  const [noteIds, setNoteIds] = useState<string[]>(fromNote ? [fromNote] : []);
  const [uploadIds, setUploadIds] = useState<string[]>(fromUpload && !fromNote ? [fromUpload] : []);
  const [sections, setSections] = useState<SummarySection[]>(["quick", "keyConcepts"]);
  const [pick, setPick] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ rec: SummaryRecord } | null>(null);
  const [del, setDel] = useState<SummaryRecord | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const subj = subject ?? profile?.subjectIds[0] ?? null;
  const bookIds = useMemo(() => (profile?.bookIds ?? []).filter((id) => getBook(id)?.subjectId === subj), [profile?.bookIds, subj]);

  const aiOn = Boolean(status?.aiReady) && (!status?.accounts || auth.status === "signed-in");
  const total = topicIds.length + noteIds.length + uploadIds.length;
  const toggle = (arr: string[], set: (v: string[]) => void, id: string, max: number) => set(arr.includes(id) ? arr.filter((x) => x !== id) : arr.length < max ? [...arr, id] : arr);

  async function run() {
    if (!profile || !total || !sections.length) return;
    setBusy(true);
    setErr(null);
    setResult(null);
    try {
      const materials: Material[] = [
        ...noteIds.flatMap((id): Material[] => {
          const n = notes.items.find((x) => x.id === id);
          return n ? [{ title: n.title || "Not", text: noteText(n).slice(0, 9000), recordId: n.id, type: "note" }] : [];
        }),
        ...uploadIds.flatMap((id): Material[] => {
          const u = uploads.items.find((x) => x.id === id);
          return u ? [{ title: u.name, text: uploadText(u).slice(0, 9000), recordId: u.id, type: "upload" }] : [];
        }),
      ];
      const r = await ai.postJson<{ content: SummaryContent; grounding: SummaryRecord["grounding"]; sources: SourceRef[]; note: string | null }>("/api/ai/summary", {
        grade: profile.grade,
        subjectId: subj,
        topicIds,
        materials,
        sections,
      });
      const title =
        (topicIds[0] ? topicLabel(topicIds[0]) : materials[0]?.title || "Özet") + (total > 1 ? ` +${total - 1}` : "");
      const rec = await create("summary", { title, subjectId: subj, topicIds, sources: r.sources, content: r.content, grounding: r.grounding });
      await create("event", { type: "summary", at: Date.now(), subjectId: subj, topicId: topicIds[0] ?? null, refId: rec.id });
      setResult({ rec });
      playTone("success");
      if (r.note) toast(r.note, "info");
    } catch (e) {
      setErr(errorText(e));
    }
    setBusy(false);
  }

  async function addCards(rec: SummaryRecord) {
    const cards = rec.content.flashcards ?? [];
    if (!cards.length) return;
    try {
      for (const c of cards) {
        await create("card", { front: c.front, back: c.back, subjectId: rec.subjectId, topicId: rec.topicIds[0] ?? null, box: 1, due: Date.now(), reps: 0, lapses: 0, summaryId: rec.id });
      }
      toast(`${cards.length} kart eklendi.`, "ok");
    } catch {
      toast("Kartlar eklenemedi.", "error");
    }
  }

  const lead =
    "Birden çok konu, not veya belge seç; istediğin türde özet çıkaralım. Kısa olan açık gelir, ayrıntı istersen genişletirsin. Özet çıkarmak için sınav hazırlaman gerekmez.";

  return (
    <div>
      <PageHeader eyebrow="Özet Çıkar" title="Kısa, işe yarar özetler" lead={lead} />

      {!aiOn && status && (
        <div className="mb-5">
          <Notice
            tone="warn"
            title={!status.ai ? "Yapay zekâ bu sürümde henüz etkin değil" : status.accounts && auth.status !== "signed-in" ? "Özet için giriş yap" : "Yapay zekâ henüz açılmadı"}
            action={
              status.accounts && auth.status !== "signed-in" && status.ai ? (
                <Link href="/giris" className="btn btn-primary btn-sm">
                  Giriş yap
                </Link>
              ) : undefined
            }
          >
            Özet üretimi yapay zekâ gerektirir. Daha önce kaydettiğin özetleri aşağıda görebilirsin.
          </Notice>
        </div>
      )}

      <section className="card space-y-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-ink">1 · Neyi özetleyelim?</h2>
          <Segmented
            value={tab}
            onChange={setTab}
            label="Kaynak türü"
            size="sm"
            options={[
              { value: "topics", label: `Konular${topicIds.length ? ` (${topicIds.length})` : ""}` },
              { value: "notes", label: `Notlarım${noteIds.length ? ` (${noteIds.length})` : ""}` },
              { value: "uploads", label: `Yüklediklerim${uploadIds.length ? ` (${uploadIds.length})` : ""}` },
            ]}
          />
        </div>

        {tab === "topics" && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                className="field"
                value={subj ?? ""}
                aria-label="Ders"
                onChange={(e) => {
                  setSubject(e.target.value);
                  setTopicIds([]);
                }}
              >
                {(profile?.subjectIds ?? []).map((s) => (
                  <option key={s} value={s}>
                    {subjectName(s)}
                  </option>
                ))}
              </select>
              <button className="field flex items-center justify-between text-left" onClick={() => setPick(true)}>
                <span className={clsx(!topicIds.length && "text-ink-3")}>{topicIds.length ? `${topicIds.length} konu seçili` : "Konu seç (birden çok olabilir)"}</span>
                <BookMarked size={17} className="text-ink-3" />
              </button>
            </div>
            {topicIds.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {topicIds.map((id) => (
                  <li key={id}>
                    <button className="badge badge-accent max-w-[280px] truncate py-1" onClick={() => setTopicIds(topicIds.filter((x) => x !== id))} aria-label={`${topicLabel(id)} seçimini kaldır`}>
                      {topicLabel(id)} ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {bookIds.length === 0 && (
              <p className="text-[13px] text-ink-3">
                Bu ders için kitap seçmedin.{" "}
                <Link href="/kitaplarim" className="text-accent underline-offset-4 hover:underline">
                  Kitap seç
                </Link>
              </p>
            )}
          </div>
        )}

        {tab === "notes" && (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {notes.items.length === 0 && <p className="py-4 text-center text-sm text-ink-3">Henüz notun yok.</p>}
            {notes.items.map((n) => {
              const on = noteIds.includes(n.id);
              return (
                <li key={n.id}>
                  <button
                    disabled={n.body.trim().length < 40}
                    onClick={() => toggle(noteIds, setNoteIds, n.id, 4)}
                    aria-pressed={on}
                    className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50", on ? "bg-accent-soft" : "hover:bg-surface-2")}
                  >
                    <span className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-accent bg-accent text-accent-ink" : "border-line-strong")}>{on && <Check size={13} strokeWidth={3} />}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">{n.title || "Başlıksız not"}</span>
                    <span className="shrink-0 text-[12.5px] text-ink-3">{n.body.trim().length < 40 ? "çok kısa" : timeAgo(n.updatedAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {tab === "uploads" && (
          <ul className="max-h-72 space-y-1 overflow-y-auto">
            {uploads.items.length === 0 && <p className="py-4 text-center text-sm text-ink-3">Henüz yüklenmiş belge yok.</p>}
            {uploads.items.map((u) => {
              const on = uploadIds.includes(u.id);
              const ok = uploadUsable(u);
              return (
                <li key={u.id}>
                  <button
                    disabled={!ok}
                    onClick={() => toggle(uploadIds, setUploadIds, u.id, 4)}
                    aria-pressed={on}
                    className={clsx("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-50", on ? "bg-accent-soft" : "hover:bg-surface-2")}
                  >
                    <span className={clsx("grid h-5 w-5 shrink-0 place-items-center rounded-md border", on ? "border-accent bg-accent text-accent-ink" : "border-line-strong")}>{on && <Check size={13} strokeWidth={3} />}</span>
                    <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">{u.name}</span>
                    <span className="shrink-0 text-[12.5px] text-ink-3">{ok ? `${u.pageCount} sayfa` : "metin yok"}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-line pt-5">
          <h2 className="mb-3 font-display text-lg text-ink">2 · Ne çıkaralım?</h2>
          <div className="flex flex-wrap gap-2">
            {SECTION_META.map((s) => {
              const on = sections.includes(s.id);
              return (
                <button key={s.id} className={clsx("chip min-h-10", on && "is-on")} aria-pressed={on} title={s.hint} onClick={() => setSections(on ? sections.filter((x) => x !== s.id) : [...sections, s.id])}>
                  {on && <Check size={14} />}
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-sm text-ink-3">{total ? `${total} kaynak seçili` : "En az bir kaynak seç"}</p>
          <button className="btn btn-primary" disabled={busy || !total || !sections.length || !aiOn} onClick={() => void run()}>
            {busy ? <Spinner /> : <Layers size={18} />} {busy ? "Hazırlanıyor…" : "Özet çıkar"}
          </button>
        </div>
      </section>

      {busy && <p className="mt-4 text-center text-sm text-ink-3">Kaynaklar okunuyor ve özet hazırlanıyor. Bu 20–60 saniye sürebilir.</p>}
      {err && (
        <div className="mt-5">
          <Notice tone="error" title="Özet hazırlanamadı">
            {err}
          </Notice>
        </div>
      )}

      {result && (
        <section className="anim-rise mt-8" aria-label="Özet sonucu">
          <ResultHeader rec={result.rec} onCards={() => void addCards(result.rec)} />
          <SummaryView content={result.rec.content} />
        </section>
      )}

      <h2 className="mb-3 mt-12 font-display text-xl text-ink">Kayıtlı özetlerim</h2>
      {saved.items.length === 0 ? (
        <p className="text-sm text-ink-3">Henüz özet yok. Hazırladıkların burada saklanır.</p>
      ) : (
        <ul className="space-y-3">
          {saved.items.map((s) => (
            <li key={s.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button className="min-w-0 flex-1 text-left" onClick={() => setOpenId(openId === s.id ? null : s.id)} aria-expanded={openId === s.id}>
                  <span className="block truncate font-medium text-ink">{s.title}</span>
                  <span className="block text-[13px] text-ink-3">
                    {subjectName(s.subjectId)} · {timeAgo(s.createdAt)}
                  </span>
                </button>
                <button className="btn btn-ghost btn-icon btn-sm" aria-label={`${s.title} özetini sil`} onClick={() => setDel(s)}>
                  <Trash2 size={16} />
                </button>
              </div>
              {openId === s.id && (
                <div className="border-t border-line p-4">
                  <ResultHeader rec={s} onCards={() => void addCards(s)} />
                  <SummaryView content={s.content} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-sm text-ink-3">
        <Link href="/ozet/kartlar" className="text-accent underline-offset-4 hover:underline">
          Bilgi kartlarını tekrar et
        </Link>
      </p>

      <TopicPicker open={pick} onClose={() => setPick(false)} bookIds={bookIds} value={topicIds} onChange={setTopicIds} multiple title="Konuları seç" />
      <ConfirmSheet
        open={del !== null}
        title="Özeti sil"
        text={`“${del?.title}” özeti silinecek. Eklediğin bilgi kartları kalır.`}
        confirmLabel="Sil"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (del) {
            await remove("summary", del.id);
            if (result?.rec.id === del.id) setResult(null);
          }
        }}
      />
    </div>
  );
}

function ResultHeader({ rec, onCards }: { rec: SummaryRecord; onCards: () => void }) {
  const [tone, text] = GROUND[rec.grounding];
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0 font-display text-[1.35rem] leading-snug text-ink">{rec.title}</h3>
        <div className="no-print flex gap-2">
          {rec.content.flashcards?.length ? (
            <button className="btn btn-secondary btn-sm" onClick={onCards}>
              <Layers size={15} /> Kartları ekle
            </button>
          ) : null}
          <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
            <Printer size={15} /> Yazdır
          </button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={clsx("badge", tone)}>{rec.grounding === "general" ? <TriangleAlert size={12} /> : <BadgeCheck size={12} />} {text}</span>
        {rec.sources.slice(0, 5).map((s, i) =>
          s.url ? (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer" className="badge max-w-[240px] truncate hover:text-accent">
              {s.label}
            </a>
          ) : (
            <span key={i} className="badge max-w-[240px] truncate">
              {s.label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={null}>
      <Summaries />
    </Suspense>
  );
}
