"use client";

import clsx from "clsx";
import { Camera, ExternalLink, FileText, FileUp, ImageIcon, ScanText, Sparkles, Trash2, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ConfirmSheet, EmptyState, Notice, PageHeader, ProgressBar, Sheet, Skeleton, Spinner } from "@/components/ui";
import { errorText, useAi, useServerStatus } from "@/lib/ai/client";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { subjectName } from "@/lib/catalog/data";
import { timeAgo } from "@/lib/dates";
import { formatBytes, validateFile } from "@/lib/files";
import { uid } from "@/lib/ids";
import { uploadUsable } from "@/lib/materials";
import { extractPdf, imageToJpeg, renderPdfPages } from "@/lib/pdf-client";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { ExtractionStatus, UploadData, UploadRecord } from "@/lib/types";

interface Working {
  key: string;
  name: string;
  step: string;
  progress: number | null;
  error?: string;
}

const STATUS: Record<ExtractionStatus, { label: string; tone: string }> = {
  ok: { label: "Metin çıkarıldı", tone: "badge-ok" },
  partial: { label: "Kısmen çıkarıldı", tone: "badge-warn" },
  ocr: { label: "Yapay zekâ ile okundu", tone: "badge-accent" },
  none: { label: "Metin çıkarılamadı", tone: "badge-warn" },
  pending: { label: "İşleniyor", tone: "" },
};

export default function UploadPage() {
  const { profile, toast } = useApp();
  const auth = useAuth();
  const status = useServerStatus();
  const ai = useAi();
  const { store, create, update, remove } = useStoreCtx();
  const uploads = useRecords("upload", { limit: 200 });
  const [working, setWorking] = useState<Working[]>([]);
  const [drag, setDrag] = useState(false);
  const [view, setView] = useState<UploadRecord | null>(null);
  const [del, setDel] = useState<UploadRecord | null>(null);
  const [ocrBusy, setOcrBusy] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);

  const aiOn = Boolean(status?.aiReady) && (!status?.accounts || auth.status === "signed-in");

  const handle = useCallback(
    async (files: File[]) => {
      if (!profile) return;
      for (const file of files.slice(0, 5)) {
        const key = uid();
        const set = (p: Partial<Working>) => setWorking((w) => w.map((x) => (x.key === key ? { ...x, ...p } : x)));
        setWorking((w) => [...w, { key, name: file.name, step: "Dosya kontrol ediliyor…", progress: null }]);
        try {
          const v = await validateFile(file);
          if (!v.ok || !v.kind) {
            set({ error: v.error ?? "Dosya kabul edilmedi.", step: "" });
            continue;
          }
          let pages: UploadData["pages"] = [];
          let pageCount = 1;
          let extraction: UploadData["extraction"] = { status: "none", chars: 0, message: "Görselden metin henüz çıkarılmadı. İstersen yapay zekâ ile okutabilirsin." };
          if (v.kind === "pdf") {
            set({ step: "Metin çıkarılıyor…", progress: 0 });
            const ex = await extractPdf(file, (d, t) => set({ progress: d / t }));
            pages = ex.pages;
            pageCount = ex.pageCount;
            const withText = ex.pages.filter((p) => p.text.length >= 40).length;
            const chars = ex.pages.reduce((n, p) => n + p.text.length, 0);
            const trunc = ex.truncated ? ` Yalnızca ilk ${ex.pages.length} sayfa işlendi.` : "";
            if (withText === 0 || chars < 40) {
              extraction = { status: "none", chars, message: "Bu PDF'de okunabilir metin bulunamadı; taranmış görüntü olabilir." + trunc };
            } else if (withText / ex.pages.length >= 0.8) {
              extraction = { status: "ok", chars, message: `${withText} sayfada metin çıkarıldı.` + trunc };
            } else {
              extraction = { status: "partial", chars, message: `${ex.pages.length} sayfanın ${withText}'inde metin bulundu; kalanlar taranmış görüntü olabilir.` + trunc };
            }
          }
          set({ step: "Kaydediliyor…", progress: null });
          const id = uid();
          let fileKey: string | undefined;
          try {
            fileKey = await store.putFile(id, file);
          } catch {
            toast("Orijinal dosya saklanamadı; çıkarılan metin yine de kaydedildi.", "error");
          }
          const rec: UploadData = {
            name: file.name.slice(0, 160),
            mime: v.mime ?? file.type,
            size: file.size,
            pageCount,
            extraction,
            pages,
            subjectId: profile.subjectIds[0] ?? null,
            topicId: null,
            ...(store.mode === "cloud" ? { storagePath: fileKey } : { localFileKey: fileKey }),
          };
          await create("upload", rec, id);
          await create("event", { type: "upload", at: Date.now(), subjectId: rec.subjectId, topicId: null, refId: id });
          setWorking((w) => w.filter((x) => x.key !== key));
          if (extraction.status === "none") toast("Dosya kaydedildi ama metin çıkarılamadı. Aşağıdan yapay zekâ ile okutmayı deneyebilirsin.", "info");
          else toast("Dosya eklendi.", "ok");
        } catch (e) {
          console.warn("upload", e);
          set({ error: "Dosya işlenemedi. Bozuk veya korumalı olabilir.", step: "" });
        }
      }
    },
    [profile, store, create, toast],
  );

  async function runOcr(u: UploadRecord) {
    if (!aiOn) return;
    setOcrBusy(u.id);
    try {
      const fileKey = u.storagePath ?? u.localFileKey;
      const blob = fileKey ? await store.getFile(fileKey) : null;
      if (!blob) throw new Error("Orijinal dosya bulunamadı");
      const file = new File([blob], u.name, { type: u.mime });
      let imgs: { n: number; mime: "image/jpeg"; data: string }[];
      if (u.mime === "application/pdf") {
        const empty = u.pages.filter((p) => p.text.length < 40).map((p) => p.n);
        const targets = (empty.length ? empty : u.pages.map((p) => p.n)).slice(0, 6);
        imgs = await renderPdfPages(file, targets);
      } else {
        imgs = [{ n: 1, ...(await imageToJpeg(file)) }];
      }
      const results: { n: number; text: string; legible: boolean }[] = [];
      for (let i = 0; i < imgs.length; i += 3) {
        const chunk = imgs.slice(i, i + 3);
        const r = await ai.postJson<{ pages: { index: number; text: string; legible: boolean }[] }>("/api/ai/ocr", { images: chunk.map((c) => ({ mime: c.mime, data: c.data })) });
        for (const p of r.pages) {
          const src = chunk[p.index];
          if (src) results.push({ n: src.n, text: p.text, legible: p.legible });
        }
      }
      const good = results.filter((r) => r.legible && r.text.trim().length > 10);
      if (!good.length) {
        await update("upload", u.id, { extraction: { status: "none", chars: u.extraction.chars, message: "Yapay zekâ da okunabilir metin bulamadı. Fotoğrafı daha net ve düz çekmeyi dene." } });
        toast("Okunabilir metin bulunamadı.", "error");
      } else {
        const map = new Map(u.pages.map((p) => [p.n, p.text]));
        for (const g of good) map.set(g.n, g.text);
        const pages = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([n, text]) => ({ n, text }));
        const chars = pages.reduce((n, p) => n + p.text.length, 0);
        await update("upload", u.id, {
          pages,
          extraction: { status: "ocr", chars, message: `${good.length} sayfa yapay zekâ ile okundu. Okuma hatalı olabilir; metni gözden geçirmen önerilir.` },
        });
        toast("Metin okundu. Lütfen kontrol et.", "ok");
      }
    } catch (e) {
      toast(errorText(e), "error");
    }
    setOcrBusy(null);
  }

  async function openOriginal(u: UploadRecord) {
    const k = u.storagePath ?? u.localFileKey;
    const blob = k ? await store.getFile(k) : null;
    if (!blob) return toast("Orijinal dosya bulunamadı.", "error");
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Notlarımı Yükle"
        title="PDF veya fotoğraf ekle"
        lead="Metni çıkarabilirsek notların gibi kullanırsın. Çıkaramazsak, bunu açıkça söyler ve yapay zekâ ile okutmayı teklif ederiz; okunamayan bir belgeyi “anladım” demeyiz."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handle([...e.dataTransfer.files]);
        }}
        className={clsx("card flex flex-col items-center gap-4 border-dashed px-6 py-10 text-center transition-colors", drag && "border-accent bg-accent-soft/40")}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent">
          <FileUp size={22} />
        </span>
        <div>
          <p className="font-display text-lg text-ink">Dosyayı buraya bırak</p>
          <p className="mt-1 text-sm text-ink-3">PDF (en fazla 25 MB) · PNG, JPEG, WebP (en fazla 10 MB)</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          <button className="btn btn-primary" onClick={() => input.current?.click()}>
            Dosya seç
          </button>
          <button className="btn btn-secondary" onClick={() => cam.current?.click()}>
            <Camera size={18} /> Fotoğraf çek
          </button>
        </div>
        <input ref={input} type="file" hidden multiple accept="application/pdf,image/png,image/jpeg,image/webp" onChange={(e) => (e.target.files ? void handle([...e.target.files]) : null)} onClick={(e) => ((e.target as HTMLInputElement).value = "")} />
        <input ref={cam} type="file" hidden accept="image/*" capture="environment" onChange={(e) => (e.target.files ? void handle([...e.target.files]) : null)} onClick={(e) => ((e.target as HTMLInputElement).value = "")} />
      </div>

      {working.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {working.map((w) => (
            <li key={w.key} className="card px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[0.95rem] font-medium text-ink">{w.name}</span>
                {w.error ? (
                  <button className="text-sm text-ink-3 underline-offset-4 hover:underline" onClick={() => setWorking((x) => x.filter((y) => y.key !== w.key))}>
                    Kapat
                  </button>
                ) : (
                  <Spinner size={16} className="text-accent" />
                )}
              </div>
              {w.error ? (
                <p className="mt-1 flex items-start gap-1.5 text-[13.5px] text-danger">
                  <TriangleAlert size={15} className="mt-0.5 shrink-0" /> {w.error}
                </p>
              ) : (
                <div className="mt-2 space-y-1.5">
                  <p className="text-[13px] text-ink-3">{w.step}</p>
                  {w.progress !== null && <ProgressBar value={w.progress} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 mt-10 font-display text-xl text-ink">Yüklediklerim</h2>
      {uploads.loading ? (
        <Skeleton className="h-28" />
      ) : uploads.items.length === 0 ? (
        <EmptyState icon={<FileText size={22} />} title="Henüz belge yok" text="Ders notlarının fotoğrafını veya bir PDF'i yükle; açıklama, özet ve test hazırlarken kaynak olarak kullanılır." />
      ) : (
        <ul className="stagger space-y-3">
          {uploads.items.map((u) => {
            const st = STATUS[u.extraction.status];
            const usable = uploadUsable(u);
            return (
              <li key={u.id} className="card p-4">
                <div className="flex items-start gap-3.5">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent">{u.mime === "application/pdf" ? <FileText size={19} /> : <ImageIcon size={19} />}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{u.name}</p>
                    <p className="mt-0.5 text-[13px] text-ink-3">
                      {formatBytes(u.size)} · {u.pageCount} sayfa · {timeAgo(u.createdAt)}
                      {u.subjectId ? ` · ${subjectName(u.subjectId)}` : ""}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className={clsx("badge", st.tone)}>{st.label}</span>
                    </div>
                    {u.extraction.message && <p className="mt-2 text-[13.5px] leading-snug text-ink-2">{u.extraction.message}</p>}
                  </div>
                </div>
                <div className="mt-3.5 flex flex-wrap gap-2 border-t border-line pt-3.5">
                  {usable && (
                    <>
                      <Link href={`/ogren?yukleme=${u.id}`} className="btn btn-secondary btn-sm">
                        <Sparkles size={15} /> Açıkla
                      </Link>
                      <Link href={`/ozet?yukleme=${u.id}`} className="btn btn-secondary btn-sm">
                        Özetle
                      </Link>
                      <button className="btn btn-ghost btn-sm" onClick={() => setView(u)}>
                        Metni gör
                      </button>
                    </>
                  )}
                  {(u.extraction.status === "none" || u.extraction.status === "partial") && (
                    <button className="btn btn-secondary btn-sm" onClick={() => void runOcr(u)} disabled={!aiOn || ocrBusy === u.id} title={aiOn ? undefined : "Yapay zekâ şu an kullanılamıyor"}>
                      {ocrBusy === u.id ? <Spinner size={15} /> : <ScanText size={15} />} Yapay zekâ ile oku
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={() => void openOriginal(u)}>
                    <ExternalLink size={15} /> Orijinal
                  </button>
                  <button className="btn btn-ghost btn-sm ml-auto text-danger" onClick={() => setDel(u)} aria-label={`${u.name} dosyasını sil`}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {!usable && !aiOn && (u.extraction.status === "none" || u.extraction.status === "partial") && (
                  <p className="mt-2.5 text-[12.5px] text-ink-3">Yapay zekâ ile okuma, hesap ve yapay zekâ yapılandırması gerektirir. Bu belge şimdilik açıklama veya özet için kullanılamaz.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <Notice tone="info" title="Gizlilik">
        PDF&apos;lerden metin çıkarma tarayıcında yapılır; dosya bu aşamada sunucuya gönderilmez. Yalnızca “Yapay zekâ ile oku” dediğin sayfa görüntüleri okunmak üzere gönderilir.
      </Notice>

      <TextSheet u={view} onClose={() => setView(null)} onSave={async (pages) => {
        if (!view) return;
        const chars = pages.reduce((n, p) => n + p.text.length, 0);
        await update("upload", view.id, { pages, extraction: { ...view.extraction, chars } });
        toast("Metin güncellendi.", "ok");
        setView(null);
      }} />
      <ConfirmSheet
        open={del !== null}
        title="Belgeyi sil"
        text={`“${del?.name}” ve çıkarılan metni kalıcı olarak silinecek.`}
        confirmLabel="Sil"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (!del) return;
          try {
            const k = del.storagePath ?? del.localFileKey;
            if (k) await store.removeFile(k);
            await remove("upload", del.id);
            toast("Belge silindi.", "ok");
          } catch {
            toast("Belge silinemedi.", "error");
          }
        }}
      />
    </div>
  );
}

function TextSheet({ u, onClose, onSave }: { u: UploadRecord | null; onClose: () => void; onSave: (pages: UploadData["pages"]) => Promise<void> }) {
  const [edit, setEdit] = useState<Record<number, string>>({});
  if (!u) return null;
  const dirty = Object.keys(edit).length > 0;
  return (
    <Sheet open onClose={() => (setEdit({}), onClose())} title={u.name} wide>
      <p className="mb-4 text-sm text-ink-3">Çıkarılan metin sayfa sayfa. Hatalı okunan yerleri düzeltebilirsin; açıklama ve özetler bu metne dayanır.</p>
      <div className="space-y-5">
        {u.pages.map((p) => (
          <div key={p.n}>
            <p className="eyebrow mb-1.5">Sayfa {p.n}</p>
            <textarea
              className="field min-h-[96px] text-[0.93rem] leading-relaxed"
              value={edit[p.n] ?? p.text}
              onChange={(e) => setEdit({ ...edit, [p.n]: e.target.value })}
              aria-label={`Sayfa ${p.n} metni`}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={() => (setEdit({}), onClose())}>
          Kapat
        </button>
        <button
          className="btn btn-primary"
          disabled={!dirty}
          onClick={async () => {
            await onSave(u.pages.map((p) => ({ n: p.n, text: edit[p.n] ?? p.text })));
            setEdit({});
          }}
        >
          Düzeltmeleri kaydet
        </button>
      </div>
    </Sheet>
  );
}
