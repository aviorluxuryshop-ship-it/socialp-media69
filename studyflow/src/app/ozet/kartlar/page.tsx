"use client";

import { ArrowLeft, Plus, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckMark, EmptyState, Sheet } from "@/components/ui";
import { useApp } from "@/lib/app";
import { subjectName } from "@/lib/catalog/data";
import { nextReview } from "@/lib/cards";
import { nowMs } from "@/lib/dates";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { CardRecord } from "@/lib/types";

export default function CardsPage() {
  const { toast } = useApp();
  const { update, create, remove } = useStoreCtx();
  const cards = useRecords("card", { limit: 500 });
  const [flip, setFlip] = useState(false);
  const [adding, setAdding] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [skipped, setSkipped] = useState<string[]>([]);
  const [session, setSession] = useState(0);

  const [now, setNow] = useState(() => nowMs());
  const due = useMemo(() => cards.items.filter((c) => c.due <= now && !skipped.includes(c.id)).sort((a, b) => a.due - b.due), [cards.items, skipped, now]);
  const cur = due[0];
  const upcoming = cards.items.length - due.length;

  async function rate(c: CardRecord, knew: boolean) {
    setFlip(false);
    try {
      await update("card", c.id, nextReview(c, knew));
      setSession((s) => s + 1);
      setNow(nowMs());
      playTone(knew ? "tap" : "soft");
      if (!knew) setSkipped((s) => [...s, c.id]); // bu oturumda tekrar gösterme; 10 dk sonra yeniden gelir
      if (due.length === 1) await create("event", { type: "cards", at: nowMs(), subjectId: c.subjectId, topicId: c.topicId, total: session + 1 });
    } catch {
      toast("Kart güncellenemedi.", "error");
    }
  }

  return (
    <div>
      <Link href="/ozet" className="btn btn-ghost btn-sm -ml-2 mb-4">
        <ArrowLeft size={17} /> Özetler
      </Link>
      <header className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Bilgi kartları</p>
          <h1 className="font-display text-[1.9rem] text-ink sm:text-[2.3rem]">Kısa aralıklarla tekrar</h1>
          <p className="mt-2 max-w-xl text-ink-2">Kartlar bildikçe seyrekleşir, unuttukça sıklaşır. Acele yok; birkaç kart bile işe yarar.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => setAdding(true)}>
          <Plus size={16} /> Kart ekle
        </button>
      </header>

      {cards.loading ? null : cards.items.length === 0 ? (
        <EmptyState
          title="Henüz kartın yok"
          text="Bir özet çıkarırken “Bilgi kartları”nı seçip kartları ekleyebilir ya da kendi kartını yazabilirsin."
          action={
            <Link href="/ozet" className="btn btn-primary btn-sm">
              Özet çıkar
            </Link>
          }
        />
      ) : cur ? (
        <div className="mx-auto max-w-xl">
          <p className="mb-3 text-center text-sm text-ink-3">
            {due.length} kart bekliyor · {upcoming} kart sonra
          </p>
          <button
            onClick={() => setFlip(!flip)}
            className="card-raised flex min-h-[260px] w-full flex-col items-center justify-center gap-4 px-6 py-10 text-center transition-transform active:scale-[0.995]"
            aria-label={flip ? "Soruyu göster" : "Cevabı göster"}
          >
            <span className="eyebrow">{flip ? "Cevap" : subjectName(cur.subjectId)}</span>
            <span className="font-display text-[1.5rem] leading-snug text-ink">{flip ? cur.back : cur.front}</span>
            {!flip && <span className="text-sm text-ink-3">Cevabı görmek için dokun</span>}
          </button>
          {flip && (
            <div className="anim-rise mt-5 grid grid-cols-2 gap-3">
              <button className="btn btn-secondary" onClick={() => void rate(cur, false)}>
                <RotateCcw size={17} /> Tekrar bak
              </button>
              <button className="btn btn-primary" onClick={() => void rate(cur, true)}>
                Biliyordum
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="anim-rise flex flex-col items-center gap-4 py-10 text-center">
          <CheckMark />
          <h2 className="font-display text-xl text-ink">Şimdilik hepsi tamam</h2>
          <p className="max-w-sm text-ink-3">{cards.items.length} kartın sıradaki tekrarı daha sonra. Dinlenmen de öğrenmenin parçası.</p>
        </div>
      )}

      {cards.items.length > 0 && (
        <details className="mt-10">
          <summary className="cursor-pointer text-sm text-ink-3 hover:text-ink">Tüm kartlar ({cards.items.length})</summary>
          <ul className="card hair mt-3 overflow-hidden">
            {cards.items.map((c) => (
              <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.95rem] text-ink">{c.front}</span>
                  <span className="block truncate text-[13px] text-ink-3">{c.back}</span>
                </span>
                <span className="badge shrink-0">Kutu {c.box}</span>
                <button className="btn btn-ghost btn-icon btn-sm" aria-label="Kartı sil" onClick={() => void remove("card", c.id)}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Kart ekle">
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Ön yüz (soru / terim)</span>
            <textarea data-autofocus className="field min-h-[72px]" value={front} onChange={(e) => setFront(e.target.value)} maxLength={400} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-ink">Arka yüz (cevap)</span>
            <textarea className="field min-h-[72px]" value={back} onChange={(e) => setBack(e.target.value)} maxLength={600} />
          </label>
          <div className="flex justify-end">
            <button
              className="btn btn-primary"
              disabled={!front.trim() || !back.trim()}
              onClick={async () => {
                await create("card", { front: front.trim(), back: back.trim(), subjectId: null, topicId: null, box: 1, due: nowMs(), reps: 0, lapses: 0 });
                setNow(nowMs());
                setFront("");
                setBack("");
                setAdding(false);
                toast("Kart eklendi.", "ok");
              }}
            >
              Ekle
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
