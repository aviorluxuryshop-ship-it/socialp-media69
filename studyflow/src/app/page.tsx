"use client";

import clsx from "clsx";
import { ArrowRight, CalendarCheck, Check, ClipboardCheck, FileText, FileUp, PenLine, PlayCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { EmptyState, Notice, SectionTitle, Skeleton } from "@/components/ui";
import { useApp } from "@/lib/app";
import { useAuth } from "@/lib/auth";
import { formatDayLong, relativeDay, timeAgo, toDay, weekdayOf } from "@/lib/dates";
import { suggest } from "@/lib/memory/insights";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import { subjectName } from "@/lib/catalog/data";
import type { TaskRecord } from "@/lib/types";

const ACTIONS = [
  { href: "/ogren", title: "Yapay Zekâ ile Öğren", text: "Bir konuyu sor; sade, doğru ve adım adım anla.", icon: Sparkles, accent: true },
  { href: "/notlar/yeni", title: "Notlarımı Yaz", text: "Kendi notların. Yapay zekâ gerekmez.", icon: PenLine },
  { href: "/yukle", title: "Notlarımı Yükle", text: "PDF veya fotoğraf ekle; metni çıkaralım.", icon: FileUp },
  { href: "/video", title: "Video İzle", text: "Doğrulanmış Türkçe anlatımlar, süre ve tarza göre.", icon: PlayCircle },
  { href: "/sinav", title: "Sınava Hazırlan", text: "Konuya göre soru çöz, sonucunu anla.", icon: ClipboardCheck },
  { href: "/ozet", title: "Özet Çıkar", text: "Notlarından ve konulardan kısa, işe yarar özetler.", icon: FileText },
] as const;

function greeting(h: number) {
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

export default function Home() {
  const { profile } = useApp();
  const auth = useAuth();
  const { update } = useStoreCtx();
  const tasks = useRecords("task");
  const notes = useRecords("note", { limit: 3 });
  const chats = useRecords("chat", { limit: 3 });
  const attempts = useRecords("attempt", { limit: 100 });
  const events = useRecords("event", { limit: 300 });
  const cards = useRecords("card", { limit: 500 });

  const today = toDay();
  const todays = useMemo(
    () =>
      tasks.items
        .filter((t) => t.type !== "class" && t.date === today)
        .sort((a, b) => (a.start ?? "99").localeCompare(b.start ?? "99")),
    [tasks.items, today],
  );
  const classesToday = useMemo(() => tasks.items.filter((t) => t.type === "class" && t.weekday === weekdayOf(today)), [tasks.items, today]);
  const missed = useMemo(() => tasks.items.filter((t) => t.type !== "class" && t.type !== "exam" && t.date < today && t.status === "todo"), [tasks.items, today]);
  const nextExam = useMemo(
    () => tasks.items.filter((t) => t.type === "exam" && t.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0],
    [tasks.items, today],
  );
  const suggestions = useMemo(
    () => suggest({ attempts: attempts.items, events: events.items, cards: cards.items }),
    [attempts.items, events.items, cards.items],
  );

  if (!profile) return null;
  const first = profile.name.trim().split(" ")[0];
  const recents = [
    ...chats.items.map((c) => ({ key: c.id, at: c.updatedAt, label: c.title || "Sohbet", kind: "Öğren", href: `/ogren?sohbet=${c.id}` })),
    ...notes.items.map((n) => ({ key: n.id, at: n.updatedAt, label: n.title || "Başlıksız not", kind: "Not", href: `/notlar/${n.id}` })),
    ...attempts.items.slice(0, 3).map((a) => ({ key: a.id, at: a.finishedAt, label: a.examTitle, kind: "Sınav", href: `/sinav/sonuc?deneme=${a.id}` })),
  ]
    .sort((a, b) => b.at - a.at)
    .slice(0, 4);

  async function toggle(t: TaskRecord) {
    const done = t.status !== "done";
    if (done) playTone("success");
    await update("task", t.id, { status: done ? "done" : "todo" });
  }

  return (
    <div className="space-y-2">
      <header className="mb-8 sm:mb-10">
        <p className="eyebrow mb-2">{formatDayLong(today)}</p>
        <h1 className="font-display text-[2.1rem] leading-[1.08] text-ink sm:text-[2.7rem]">
          {greeting(new Date().getHours())}
          {first ? `, ${first}` : ""}.
        </h1>
        <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-ink-2">Bugün ne yapmak istersin? Her bölüm tek başına çalışır; ikisini birleştirmen gerekmez.</p>
      </header>

      {auth.status !== "signed-in" && (
        <div className="mb-6">
          <Notice
            tone="info"
            title={auth.status === "unconfigured" ? "Hesap bu sürümde etkin değil" : "Hesap bağlı değil"}
            action={
              auth.status === "signed-out" ? (
                <Link href="/giris" className="btn btn-secondary btn-sm">
                  Giriş yap veya hesap oluştur
                </Link>
              ) : undefined
            }
          >
            Notların, planın ve sınav sonuçların şu an yalnızca bu tarayıcıda saklanıyor; tarayıcı verisi silinirse kaybolur.
            {auth.status === "signed-out" ? " Hesap açarsan güvenle saklanır ve cihazlar arasında eşitlenir." : ""}
          </Notice>
        </div>
      )}

      {/* Altı eylem */}
      <section aria-label="Ne yapmak istersin?" className="stagger grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.href}
              href={a.href}
              className={clsx(
                "group card relative flex min-h-[132px] flex-col justify-between gap-5 overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-2)]",
                "accent" in a && a.accent && "border-accent/40 bg-accent-soft/50",
              )}
            >
              <span className={clsx("grid h-10 w-10 place-items-center rounded-xl", "accent" in a && a.accent ? "bg-accent text-accent-ink" : "bg-surface-2 text-accent")}>
                <Icon size={20} strokeWidth={1.9} />
              </span>
              <span>
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-[1.22rem] leading-tight text-ink">{a.title}</span>
                  <ArrowRight size={18} className="shrink-0 -translate-x-1 text-ink-3 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
                <span className="mt-1 block text-[0.9rem] leading-snug text-ink-3">{a.text}</span>
              </span>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-x-8 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <SectionTitle aside={<Link href="/plan" className="underline-offset-4 hover:text-ink hover:underline">Planı aç</Link>}>Bugün</SectionTitle>
          {tasks.loading ? (
            <Skeleton className="h-32 w-full" />
          ) : todays.length === 0 && classesToday.length === 0 ? (
            <EmptyState
              icon={<CalendarCheck size={22} />}
              title="Bugün için görev yok"
              text="Sınav tarihini ekleyip birkaç saniyede gerçekçi bir çalışma planı oluşturabilirsin."
              action={
                <Link href="/plan" className="btn btn-secondary btn-sm">
                  Plan oluştur
                </Link>
              }
            />
          ) : (
            <ul className="card hair overflow-hidden">
              {classesToday.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 text-[0.95rem]">
                  <span className="w-[88px] shrink-0 text-sm tabular-nums text-ink-3">{c.start ? `${c.start}–${c.end}` : "Ders"}</span>
                  <span className="min-w-0 flex-1 truncate text-ink-2">{c.title}</span>
                  <span className="badge">Ders</span>
                </li>
              ))}
              {todays.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-3.5 text-[0.95rem]">
                  <button
                    onClick={() => void toggle(t)}
                    role="checkbox"
                    aria-checked={t.status === "done"}
                    aria-label={`${t.title} tamamlandı`}
                    className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors", t.status === "done" ? "border-ok bg-ok text-accent-ink" : "border-line-strong hover:border-accent")}
                  >
                    {t.status === "done" && <Check size={14} strokeWidth={3} />}
                  </button>
                  <span className="w-[72px] shrink-0 text-sm tabular-nums text-ink-3">{t.start ?? "Gün içi"}</span>
                  <span className={clsx("min-w-0 flex-1 truncate", t.status === "done" ? "text-ink-3 line-through" : "text-ink")}>{t.title}</span>
                </li>
              ))}
            </ul>
          )}
          {missed.length > 0 && (
            <div className="mt-3">
              <Notice
                tone="warn"
                title={`${missed.length} görev yapılamadı`}
                action={
                  <Link href="/plan?yenidenplanla=1" className="btn btn-secondary btn-sm">
                    Yeniden planla
                  </Link>
                }
              >
                Sorun değil — boş zamanlarına yeniden yerleştirelim.
              </Notice>
            </div>
          )}
          {nextExam && (
            <p className="mt-3 text-sm text-ink-3">
              Sıradaki sınav: <span className="font-medium text-ink-2">{nextExam.title}</span> · {relativeDay(nextExam.date)}
            </p>
          )}
        </div>

        <div>
          <SectionTitle>Önerilen adım</SectionTitle>
          <div className="space-y-3">
            {suggestions.slice(0, 2).map((s) => (
              <Link key={s.id} href={s.href} className="card group block p-4 transition-colors hover:bg-surface-2">
                <p className="font-semibold text-ink">{s.title}</p>
                <p className="mt-1 text-[0.92rem] leading-relaxed text-ink-3">{s.reason}</p>
                <span className="mt-2.5 inline-flex items-center gap-1 text-sm font-medium text-accent">
                  Başla <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {recents.length > 0 && (
        <div>
          <SectionTitle>Kaldığın yerden</SectionTitle>
          <ul className="card hair overflow-hidden">
            {recents.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2">
                  <span className="badge shrink-0">{r.kind}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.95rem] text-ink">{r.label}</span>
                  <span className="shrink-0 text-sm text-ink-3">{timeAgo(r.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {profile.subjectIds.length > 0 && (
        <p className="pt-6 text-sm text-ink-3">
          Dersler: {profile.subjectIds.map((s) => subjectName(s)).join(" · ")}.{" "}
          <Link href="/hos-geldin?duzenle=1" className="underline-offset-4 hover:text-ink hover:underline">
            Düzenle
          </Link>
        </p>
      )}
    </div>
  );
}
