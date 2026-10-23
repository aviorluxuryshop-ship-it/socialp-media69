"use client";

import clsx from "clsx";
import { BadgeCheck, Check, Search, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Notice, PageHeader, Segmented } from "@/components/ui";
import { useApp } from "@/lib/app";
import { topicLabel } from "@/lib/catalog";
import { SUBJECT_BY_ID, subjectName } from "@/lib/catalog/data";
import { fold } from "@/lib/text";
import { useRecords } from "@/lib/store/provider";
import { type DurationBucket, formatDuration, inBucket, lineage, STYLE_LABEL, STYLE_ORDER, thumb, type VideoStyle, VIDEOS, VIDEOS_GENERATED_AT } from "@/lib/videos";

function VideoCatalog() {
  const { profile } = useApp();
  const params = useSearchParams();
  const states = useRecords("video", { limit: 300 });
  const [subject, setSubject] = useState<string>(() => {
    const t = params.get("konu");
    const m = t?.match(/^b(\d+)-/);
    return m ? (VIDEOS.find((v) => v.topicIds.some((x) => x.startsWith(`b${m[1]}-`)))?.subjectId ?? "") : "";
  });
  const [topic, setTopic] = useState<string | null>(params.get("konu"));
  const [styles, setStyles] = useState<VideoStyle[]>([]);
  const [dur, setDur] = useState<DurationBucket>("all");
  const [q, setQ] = useState("");

  const grade = profile?.grade ?? 9;
  const watched = useMemo(() => new Set(states.items.filter((s) => s.watched).map((s) => s.videoId)), [states.items]);
  const topicLineage = useMemo(() => (topic ? lineage(topic) : null), [topic]);

  const gradeVideos = useMemo(() => VIDEOS.filter((v) => v.grade === grade), [grade]);
  const subjectIds = useMemo(() => {
    const ids = [...new Set(gradeVideos.map((v) => v.subjectId))];
    const mine = new Set(profile?.subjectIds ?? []);
    return ids.sort((a, b) => Number(mine.has(b)) - Number(mine.has(a)));
  }, [gradeVideos, profile?.subjectIds]);

  const list = useMemo(() => {
    const needle = fold(q);
    return gradeVideos
      .filter((v) => (!subject || v.subjectId === subject) && (!topicLineage || v.topicIds.some((t) => topicLineage.has(t))))
      .filter((v) => styles.every((s) => v.styles.includes(s)))
      .filter((v) => inBucket(v.durationSec, dur))
      .filter((v) => !needle || fold(`${v.title} ${v.channel} ${v.topicIds.map(topicLabel).join(" ")}`).includes(needle))
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }, [gradeVideos, subject, topicLineage, styles, dur, q]);

  const styleCount = (s: VideoStyle) => gradeVideos.filter((v) => (!subject || v.subjectId === subject) && v.styles.includes(s)).length;

  return (
    <div>
      <PageHeader
        eyebrow="Video İzle"
        title="Doğrulanmış Türkçe anlatımlar"
        lead={`${grade}. sınıf için seçilmiş videolar. Her biri YouTube'un resmî gömme bağlantısıyla oynatılır; yalnızca gömülebilir olduğu ve künyesi eşleştiği doğrulananlar listelenir. Video izlemek için yapay zekâ gerekmez.`}
      />

      <div className="mb-5 space-y-4">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input className="field pl-10" placeholder="Konu, kanal veya başlık ara…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Video ara" />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Ders">
          <button className={clsx("chip", !subject && "is-on")} aria-pressed={!subject} onClick={() => setSubject("")}>
            Tümü
          </button>
          {subjectIds.map((s) => (
            <button key={s} className={clsx("chip", subject === s && "is-on")} aria-pressed={subject === s} onClick={() => setSubject(subject === s ? "" : s)}>
              {SUBJECT_BY_ID.get(s)?.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Anlatım tarzı">
          {STYLE_ORDER.map((s) => {
            const n = styleCount(s);
            const on = styles.includes(s);
            return (
              <button
                key={s}
                className={clsx("chip", on && "is-on", n === 0 && "opacity-45")}
                aria-pressed={on}
                disabled={n === 0}
                title={n === 0 ? "Bu tarz için doğrulanmış video henüz yok" : undefined}
                onClick={() => setStyles(on ? styles.filter((x) => x !== s) : [...styles, s])}
              >
                {on && <Check size={14} />}
                {STYLE_LABEL[s]} <span className="text-ink-3">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            value={dur}
            onChange={setDur}
            label="Süre"
            size="sm"
            options={[
              { value: "all", label: "Her süre" },
              { value: "short", label: "≤ 10 dk" },
              { value: "mid", label: "10–30 dk" },
              { value: "long", label: "30 dk+" },
            ]}
          />
          {topic && (
            <button className="badge badge-accent max-w-[320px] truncate py-1.5" onClick={() => setTopic(null)} aria-label="Konu filtresini kaldır">
              {topicLabel(topic)} <X size={13} />
            </button>
          )}
        </div>
      </div>

      {list.length === 0 ? (
        <Notice tone="info" title="Bu seçime uyan doğrulanmış video yok">
          Kataloğu uydurma bağlantılarla doldurmuyoruz; yalnızca doğrulananları gösteriyoruz. Filtreleri gevşetmeyi dene.
        </Notice>
      ) : (
        <ul className="stagger grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => (
            <li key={v.id}>
              <Link href={`/video/${v.id}`} className="card group block overflow-hidden transition-shadow hover:shadow-[var(--shadow-2)]">
                <div className="relative aspect-video bg-surface-2">
                  {/* YouTube küçük resmi (doğrulanmış) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(v.id)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[12px] font-medium tabular-nums text-white">{formatDuration(v.durationSec)}</span>
                  {watched.has(v.id) && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ok px-2 py-0.5 text-[11.5px] font-semibold text-white">
                      <Check size={12} strokeWidth={3} /> İzledim
                    </span>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="line-clamp-2 text-[0.97rem] font-medium leading-snug text-ink">{v.title.replace(/\s*\|\s*/g, " · ")}</p>
                  <p className="text-[13px] text-ink-3">
                    {v.channel} · {v.publishedAt.slice(0, 4)}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge badge-accent">{subjectName(v.subjectId)}</span>
                    {v.styles.map((s) => (
                      <span key={s} className="badge">
                        {STYLE_LABEL[s]}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-10 space-y-2 text-[13px] leading-relaxed text-ink-3">
        <p className="flex items-start gap-1.5">
          <BadgeCheck size={15} className="mt-0.5 shrink-0 text-ok" />
          <span>
            Doğrulama ({VIDEOS_GENERATED_AT}): video YouTube&apos;da mevcut, gömülebilir ve başlığı/kanalı künyeyle eşleşiyor; süre ve yayın tarihi YouTube meta verisinden alındı. Konu eşleşmesi başlık ve açıklamaya
            göre editoryal olarak yapıldı; Maarif Modeli uyumu için yayın tarihi ve başlık dikkate alındı. Etiketler (kısa, ayrıntılı, soru çözümü…) süre ve başlıktan otomatik çıkarılır.
          </span>
        </p>
        <p>Videolar üçüncü taraf eğitmenlere aittir; MEB ders kitabıyla küçük farklar olabilir. Bazı kanallar kendi ürünlerini tanıtır.</p>
      </div>
    </div>
  );
}

export default function VideoPage() {
  return (
    <Suspense fallback={null}>
      <VideoCatalog />
    </Suspense>
  );
}
