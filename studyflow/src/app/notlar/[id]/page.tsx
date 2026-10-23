"use client";

import clsx from "clsx";
import { ArrowLeft, Bold, Check, ClipboardCheck, Eye, FileText, Heading2, Italic, List, ListOrdered, Pencil, Pin, PinOff, Quote, Sigma, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "@/components/Markdown";
import { TopicPicker } from "@/components/TopicPicker";
import { ConfirmSheet, Skeleton, Spinner } from "@/components/ui";
import { useApp } from "@/lib/app";
import { getBook, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { formatTime } from "@/lib/dates";
import { prefixLines, wordCount, wrapSelection, type EditResult } from "@/lib/mdedit";
import { useRecord, useStoreCtx } from "@/lib/store/provider";
import type { NoteData } from "@/lib/types";

type SaveState = "saved" | "dirty" | "saving" | "error";

const TOOLS: { label: string; icon: typeof Bold; edit: (v: string, s: number, e: number) => EditResult }[] = [
  { label: "Kalın", icon: Bold, edit: (v, s, e) => wrapSelection(v, s, e, "**") },
  { label: "İtalik", icon: Italic, edit: (v, s, e) => wrapSelection(v, s, e, "*") },
  { label: "Başlık", icon: Heading2, edit: (v, s, e) => prefixLines(v, s, e, "## ") },
  { label: "Madde listesi", icon: List, edit: (v, s, e) => prefixLines(v, s, e, "- ") },
  { label: "Numaralı liste", icon: ListOrdered, edit: (v, s, e) => prefixLines(v, s, e, "", true) },
  { label: "Alıntı / önemli", icon: Quote, edit: (v, s, e) => prefixLines(v, s, e, "> ") },
  { label: "Formül ($…$)", icon: Sigma, edit: (v, s, e) => wrapSelection(v, s, e, "$", "$", "x^2") },
];

export default function NoteEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, toast } = useApp();
  const { create } = useStoreCtx();
  const isNew = id === "yeni";
  const { item, loading } = useRecord("note", isNew ? null : id);
  const creating = useRef(false);

  // /notlar/yeni → boş not oluştur ve gerçek adrese geç
  useEffect(() => {
    if (!isNew || creating.current || !profile) return;
    creating.current = true;
    create("note", { title: "", body: "", subjectId: profile.subjectIds[0] ?? null, topicId: null, tags: [], pinned: false })
      .then((r) => router.replace(`/notlar/${r.id}`))
      .catch(() => {
        toast("Not oluşturulamadı.", "error");
        router.replace("/notlar");
      });
  }, [isNew, profile, create, router, toast]);

  if (isNew || loading) {
    return (
      <div className="space-y-4" aria-busy>
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (!item) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display text-xl text-ink">Not bulunamadı</p>
        <p className="mt-1 text-ink-3">Silinmiş olabilir veya başka bir hesaba ait.</p>
        <Link href="/notlar" className="btn btn-secondary mt-5">
          Notlara dön
        </Link>
      </div>
    );
  }
  return <Editor key={item.id} id={item.id} initial={{ title: item.title, body: item.body, subjectId: item.subjectId, topicId: item.topicId, tags: item.tags, pinned: item.pinned }} />;
}

function Editor({ id, initial }: { id: string; initial: NoteData }) {
  const { profile, toast } = useApp();
  const { update, remove, create } = useStoreCtx();
  const router = useRouter();
  const [data, setData] = useState<NoteData>(initial);
  const [state, setState] = useState<SaveState>("saved");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [preview, setPreview] = useState(false);
  const [pickTopic, setPickTopic] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const ta = useRef<HTMLTextAreaElement>(null);
  const latest = useRef(data);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eventLogged = useRef(false);
  const deleted = useRef(false);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!dirty.current || deleted.current) return;
    dirty.current = false;
    setState("saving");
    try {
      await update("note", id, latest.current);
      setState(dirty.current ? "dirty" : "saved");
      setSavedAt(Date.now());
      if (!eventLogged.current && latest.current.body.trim().length >= 30) {
        eventLogged.current = true;
        await create("event", { type: "note", at: Date.now(), subjectId: latest.current.subjectId, topicId: latest.current.topicId, refId: id });
      }
    } catch {
      dirty.current = true;
      setState("error");
    }
  }, [id, update, create]);

  const change = useCallback(
    (patch: Partial<NoteData>) => {
      setData((d) => {
        const n = { ...d, ...patch };
        latest.current = n;
        return n;
      });
      dirty.current = true;
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), 700);
    },
    [flush],
  );

  // Sayfadan çıkarken / sekme gizlenirken bekleyen değişikliği yaz
  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && void flush();
    const onUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        void flush();
        e.preventDefault();
      }
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("beforeunload", onUnload);
      void flush();
    };
  }, [flush]);

  function apply(fn: (v: string, s: number, e: number) => EditResult) {
    const el = ta.current;
    if (!el) return;
    const r = fn(data.body, el.selectionStart, el.selectionEnd);
    change({ body: r.value });
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(r.start, r.end);
    });
  }

  const bookIds = (profile?.bookIds ?? []).filter((b) => getBook(b)?.subjectId === data.subjectId);

  const status =
    state === "saving" ? (
      <span className="inline-flex items-center gap-1.5 text-ink-3">
        <Spinner size={13} /> Kaydediliyor…
      </span>
    ) : state === "error" ? (
      <button className="text-danger underline-offset-4 hover:underline" onClick={() => void flush()}>
        Kaydedilemedi — tekrar dene
      </button>
    ) : state === "dirty" ? (
      <span className="text-ink-3">Değişiklikler…</span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-ink-3">
        <Check size={14} className="text-ok" /> {savedAt ? `Kaydedildi ${formatTime(savedAt)}` : "Kaydedildi"}
      </span>
    );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/notlar" onClick={() => void flush()} className="btn btn-ghost btn-sm -ml-2">
          <ArrowLeft size={17} /> Notlar
        </Link>
        <div className="text-[13px]" aria-live="polite">
          {status}
        </div>
      </div>

      <input
        value={data.title}
        onChange={(e) => change({ title: e.target.value })}
        placeholder="Başlıksız not"
        aria-label="Not başlığı"
        maxLength={140}
        className="mb-4 w-full bg-transparent font-display text-[2rem] leading-tight text-ink outline-none placeholder:text-ink-3/60 sm:text-[2.4rem]"
      />

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <select
          className="field w-auto min-w-[150px] py-2 text-[14px]"
          value={data.subjectId ?? ""}
          aria-label="Ders"
          onChange={(e) => change({ subjectId: e.target.value || null, topicId: null })}
        >
          <option value="">Ders yok</option>
          {(profile?.subjectIds ?? []).map((s) => (
            <option key={s} value={s}>
              {subjectName(s)}
            </option>
          ))}
        </select>
        <button className="chip" onClick={() => setPickTopic(true)} disabled={!data.subjectId}>
          {data.topicId ? topicLabel(data.topicId).slice(0, 38) : "Konu ekle"}
        </button>
        <button className={clsx("chip", data.pinned && "is-on")} aria-pressed={data.pinned} onClick={() => change({ pinned: !data.pinned })}>
          {data.pinned ? <PinOff size={15} /> : <Pin size={15} />} {data.pinned ? "Sabit" : "Sabitle"}
        </button>
        <input
          className="field w-auto min-w-[140px] flex-1 py-2 text-[14px]"
          placeholder="Etiketler (virgülle)"
          aria-label="Etiketler"
          defaultValue={data.tags.join(", ")}
          onBlur={(e) => change({ tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 8) })}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-2/60 px-2 py-1.5">
          <div className="flex flex-wrap items-center gap-0.5" role="toolbar" aria-label="Biçimlendirme">
            {TOOLS.map((t) => (
              <button key={t.label} className="btn btn-ghost btn-icon btn-sm" aria-label={t.label} title={t.label} onClick={() => apply(t.edit)} disabled={preview}>
                <t.icon size={17} />
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setPreview(!preview)} aria-pressed={preview}>
            {preview ? <Pencil size={16} /> : <Eye size={16} />} {preview ? "Düzenle" : "Önizle"}
          </button>
        </div>
        {preview ? (
          <div className="min-h-[360px] px-5 py-5">{data.body.trim() ? <Markdown>{data.body}</Markdown> : <p className="text-ink-3">Önizlenecek bir şey yok.</p>}</div>
        ) : (
          <textarea
            ref={ta}
            value={data.body}
            onChange={(e) => change({ body: e.target.value })}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
                e.preventDefault();
                apply(TOOLS[0].edit);
              } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
                e.preventDefault();
                apply(TOOLS[1].edit);
              }
            }}
            placeholder={"Notunu buraya yaz…\n\nİpucu: **kalın**, *italik*, ## başlık, - liste ve $x^2$ gibi formüller desteklenir."}
            aria-label="Not metni"
            className="min-h-[360px] w-full resize-y bg-transparent px-5 py-5 font-[inherit] text-[1.02rem] leading-[1.75] text-ink outline-none placeholder:text-ink-3/70"
            spellCheck
          />
        )}
        <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[12.5px] text-ink-3">
          <span>{wordCount(data.body)} kelime</span>
          <span>Markdown · otomatik kayıt</span>
        </div>
      </div>

      <section className="mt-6" aria-label="Bu notla yapılabilecekler">
        <p className="eyebrow mb-3">İstersen bu notla</p>
        <div className="flex flex-wrap gap-2.5">
          <Link href={`/ogren?not=${id}`} className="btn btn-secondary btn-sm" onClick={() => void flush()}>
            <Sparkles size={16} /> Yapay zekâ ile açıkla
          </Link>
          <Link href={`/ozet?not=${id}`} className="btn btn-secondary btn-sm" onClick={() => void flush()}>
            <FileText size={16} /> Özetle
          </Link>
          <Link href={`/sinav?not=${id}`} className="btn btn-secondary btn-sm" onClick={() => void flush()}>
            <ClipboardCheck size={16} /> Test hazırla
          </Link>
          <button className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirmDel(true)}>
            <Trash2 size={16} /> Sil
          </button>
        </div>
      </section>

      <TopicPicker open={pickTopic} onClose={() => setPickTopic(false)} bookIds={bookIds} value={data.topicId ? [data.topicId] : []} onChange={(v) => change({ topicId: v[0] ?? null })} />
      <ConfirmSheet
        open={confirmDel}
        title="Notu sil"
        text="Bu not kalıcı olarak silinecek. Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onClose={() => setConfirmDel(false)}
        onConfirm={async () => {
          deleted.current = true;
          try {
            await remove("note", id);
            toast("Not silindi.", "ok");
            router.replace("/notlar");
          } catch {
            deleted.current = false;
            toast("Not silinemedi.", "error");
          }
        }}
      />
    </div>
  );
}
