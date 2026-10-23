"use client";

import clsx from "clsx";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Pencil, Plus, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { TopicPicker } from "@/components/TopicPicker";
import { ConfirmSheet, EmptyState, Field, Notice, PageHeader, Segmented, Sheet } from "@/components/ui";
import { DEFAULT_AVAILABILITY, useApp } from "@/lib/app";
import { getBook, resolveTopic, topicLabel } from "@/lib/catalog";
import { subjectName } from "@/lib/catalog/data";
import { addDays, diffDays, formatDay, formatDayLong, nowMs, relativeDay, toDay, WEEKDAYS_LONG, WEEKDAYS_SHORT, weekdayOf } from "@/lib/dates";
import { levelOf, topicStats } from "@/lib/memory/insights";
import { generatePlan, proposeReschedule, type NewTask, type PlanTopic, type Reschedule, weekDays } from "@/lib/planner/schedule";
import { playTone } from "@/lib/sound";
import { useRecords, useStoreCtx } from "@/lib/store/provider";
import type { DayWindow, TaskData, TaskRecord, TaskType } from "@/lib/types";

const TYPES: { value: TaskType; label: string }[] = [
  { value: "study", label: "Çalışma" },
  { value: "homework", label: "Ödev" },
  { value: "exam", label: "Sınav" },
  { value: "class", label: "Ders" },
];
const TYPE_LABEL: Record<TaskType, string> = { class: "Ders", exam: "Sınav", homework: "Ödev", study: "Çalışma", revision: "Tekrar" };
type View = "day" | "homework" | "exams" | "program";

function blank(day: string, type: TaskType = "study", subjectId: string | null = null): TaskData {
  return { type, title: "", subjectId, topicId: null, date: day, start: null, end: null, status: "todo", auto: false, weekly: type === "class", weekday: weekdayOf(day) };
}

function Planner() {
  const { profile, toast, patchProfile } = useApp();
  const params = useSearchParams();
  const { create, update, remove } = useStoreCtx();
  const tasks = useRecords("task", { limit: 1000 });
  const attempts = useRecords("attempt", { limit: 200 });
  const today = toDay();
  const [view, setView] = useState<View>("day");
  const [anchor, setAnchor] = useState(today);
  const [sel, setSel] = useState(today);
  const [edit, setEdit] = useState<{ id: string | null; data: TaskData } | null>(null);
  const [del, setDel] = useState<TaskRecord | null>(null);
  const [gen, setGen] = useState(false);
  const [reschedOpen, setReschedOpen] = useState(() => Boolean(params.get("yenidenplanla")));
  const [pickTopics, setPickTopics] = useState<string | null>(null);

  const resched = useMemo<Reschedule[] | null>(
    () => (reschedOpen && profile && !tasks.loading ? proposeReschedule({ today, availability: profile.availability, tasks: tasks.items }) : null),
    [reschedOpen, profile, tasks.loading, tasks.items, today],
  );

  const week = useMemo(() => weekDays(anchor), [anchor]);
  const byDay = useMemo(() => {
    const m = new Map<string, TaskRecord[]>();
    for (const d of week) {
      const wd = weekdayOf(d);
      m.set(
        d,
        tasks.items
          .filter((t) => (t.type === "class" && t.weekly ? t.weekday === wd && t.date <= d : t.date === d))
          .sort((a, b) => (a.start ?? "99:99").localeCompare(b.start ?? "99:99")),
      );
    }
    return m;
  }, [tasks.items, week]);
  const missed = useMemo(() => tasks.items.filter((t) => ["study", "revision", "homework"].includes(t.type) && t.status === "todo" && t.date < today), [tasks.items, today]);
  const exams = useMemo(() => tasks.items.filter((t) => t.type === "exam").sort((a, b) => a.date.localeCompare(b.date)), [tasks.items]);
  const homework = useMemo(() => tasks.items.filter((t) => t.type === "homework").sort((a, b) => Number(a.status === "done") - Number(b.status === "done") || a.date.localeCompare(b.date)), [tasks.items]);
  const classes = useMemo(() => tasks.items.filter((t) => t.type === "class"), [tasks.items]);

  if (!profile) return null;

  async function save() {
    if (!edit) return;
    const d = { ...edit.data, title: edit.data.title.trim() };
    if (!d.title) return toast("Bir başlık yaz.", "error");
    if (d.start && d.end && d.end <= d.start) return toast("Bitiş saati başlangıçtan sonra olmalı.", "error");
    try {
      const data: TaskData = { ...d, weekday: d.type === "class" ? d.weekday ?? weekdayOf(d.date) : undefined, weekly: d.type === "class" ? true : undefined };
      if (edit.id) await update("task", edit.id, data);
      else await create("task", data);
      setEdit(null);
      toast("Kaydedildi.", "ok");
    } catch {
      toast("Kaydedilemedi.", "error");
    }
  }

  async function toggleDone(t: TaskRecord) {
    const done = t.status !== "done";
    if (done) playTone("success");
    await update("task", t.id, { status: done ? "done" : "todo" });
    if (done && (t.type === "study" || t.type === "revision")) {
      const mins = t.start && t.end ? (Number(t.end.slice(0, 2)) * 60 + Number(t.end.slice(3)) - Number(t.start.slice(0, 2)) * 60 - Number(t.start.slice(3))) : 30;
      await create("event", { type: "study", at: nowMs(), subjectId: t.subjectId, topicId: t.topicId, minutes: Math.max(5, mins), refId: t.id });
    }
  }

  const dayTasks = byDay.get(sel) ?? [];
  const lead = "Haftalık programın, sınav takvimin, ödevlerin ve çalışma planın tek yerde. Plan; boş saatlerine, yaklaşan sınavlarına ve öğrenme geçmişine göre oluşturulur.";

  return (
    <div>
      <PageHeader
        eyebrow="Plan"
        title="Haftanı sakince planla"
        lead={lead}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setGen(true)}>
              <Wand2 size={17} /> Plan oluştur
            </button>
            <button className="btn btn-primary" onClick={() => setEdit({ id: null, data: blank(sel, view === "homework" ? "homework" : view === "exams" ? "exam" : "study", profile.subjectIds[0] ?? null) })}>
              <Plus size={17} /> Ekle
            </button>
          </>
        }
      />

      {missed.length > 0 && (
        <div className="mb-5">
          <Notice
            tone="warn"
            title={`${missed.length} görev yapılamadı`}
            action={
              <button className="btn btn-secondary btn-sm" onClick={() => setReschedOpen(true)}>
                Yeniden planlamayı gör
              </button>
            }
          >
            Olur böyle. Boş zamanlarına yeniden yerleştirelim; onaylamadan hiçbir şey değişmez.
          </Notice>
        </div>
      )}

      <div className="mb-6">
        <Segmented
          value={view}
          onChange={setView}
          label="Bölüm"
          options={[
            { value: "day", label: "Hafta" },
            { value: "homework", label: "Ödevler" },
            { value: "exams", label: "Sınavlar" },
            { value: "program", label: "Program" },
          ]}
        />
      </div>

      {view === "day" && (
        <section aria-label="Haftalık görünüm">
          <div className="mb-3 flex items-center justify-between">
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Önceki hafta" onClick={() => setAnchor(addDays(anchor, -7))}>
              <ChevronLeft size={19} />
            </button>
            <div className="text-center">
              <p className="font-display text-lg text-ink">
                {formatDay(week[0])} – {formatDay(week[6])}
              </p>
              {week[0] !== weekDays(today)[0] && (
                <button className="text-sm text-accent underline-offset-4 hover:underline" onClick={() => (setAnchor(today), setSel(today))}>
                  Bu haftaya dön
                </button>
              )}
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" aria-label="Sonraki hafta" onClick={() => setAnchor(addDays(anchor, 7))}>
              <ChevronRight size={19} />
            </button>
          </div>
          <div className="mb-5 grid grid-cols-7 gap-1.5 sm:gap-2" role="tablist" aria-label="Günler">
            {week.map((d, i) => {
              const items = byDay.get(d) ?? [];
              const on = d === sel;
              const hasExam = items.some((t) => t.type === "exam");
              const open = items.filter((t) => t.type !== "class" && t.status === "todo").length;
              return (
                <button
                  key={d}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSel(d)}
                  className={clsx(
                    "flex flex-col items-center gap-0.5 rounded-2xl border py-2.5 transition-colors",
                    on ? "border-accent bg-accent text-accent-ink" : d === today ? "border-accent/50 bg-accent-soft text-ink" : "border-line bg-surface text-ink-2 hover:bg-surface-2",
                  )}
                >
                  <span className="text-[11px] font-medium opacity-80">{WEEKDAYS_SHORT[i]}</span>
                  <span className="text-[1.05rem] font-semibold tabular-nums">{Number(d.slice(8))}</span>
                  <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                    {hasExam && <i className={clsx("block h-1.5 w-1.5 rounded-full", on ? "bg-accent-ink" : "bg-brass")} />}
                    {open > 0 && <i className={clsx("block h-1.5 w-1.5 rounded-full", on ? "bg-accent-ink/70" : "bg-accent")} />}
                  </span>
                </button>
              );
            })}
          </div>

          <h2 className="mb-3 font-display text-xl text-ink">{formatDayLong(sel)}</h2>
          {tasks.loading ? null : dayTasks.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={22} />}
              title="Bu gün boş"
              text="Dinlenmek de plandır. İstersen bir çalışma ekleyebilir ya da plan oluşturabilirsin."
              action={
                <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ id: null, data: blank(sel, "study", profile.subjectIds[0] ?? null) })}>
                  Çalışma ekle
                </button>
              }
            />
          ) : (
            <ul className="card hair overflow-hidden">
              {dayTasks.map((t) => (
                <TaskRow key={t.id} t={t} today={today} onToggle={() => void toggleDone(t)} onEdit={() => setEdit({ id: t.id, data: { ...t } })} onDelete={() => setDel(t)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {view === "homework" && (
        <section aria-label="Ödevler">
          {homework.length === 0 ? (
            <EmptyState title="Ödev yok" text="Teslim tarihi olan ödevlerini ekle; yaklaşanlar burada ve ana sayfada görünür." />
          ) : (
            <ul className="card hair overflow-hidden">
              {homework.map((t) => (
                <TaskRow key={t.id} t={t} today={today} showDate onToggle={() => void toggleDone(t)} onEdit={() => setEdit({ id: t.id, data: { ...t } })} onDelete={() => setDel(t)} />
              ))}
            </ul>
          )}
        </section>
      )}

      {view === "exams" && (
        <section aria-label="Sınav takvimi">
          {exams.length === 0 ? (
            <EmptyState title="Sınav tarihi yok" text="Sınav tarihlerini ekle; plan oluştururken sınavdan geriye doğru çalışma yerleştirilir." />
          ) : (
            <ul className="stagger space-y-3">
              {exams.map((t) => {
                const n = diffDays(t.date, today);
                return (
                  <li key={t.id} className="card flex flex-wrap items-center gap-4 p-4">
                    <div className={clsx("grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-center", n < 0 ? "bg-surface-2 text-ink-3" : "bg-brass-soft text-brass")}>
                      <span className="text-[1.3rem] font-semibold leading-none tabular-nums">{Math.abs(n)}</span>
                      <span className="text-[10px] font-medium">{n < 0 ? "gün önce" : n === 0 ? "bugün" : "gün kaldı"}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{t.title}</p>
                      <p className="text-[13px] text-ink-3">
                        {formatDayLong(t.date)}
                        {t.subjectId ? ` · ${subjectName(t.subjectId)}` : ""}
                        {t.topicIds?.length ? ` · ${t.topicIds.length} konu` : ""}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label="Düzenle" onClick={() => setEdit({ id: t.id, data: { ...t } })}>
                        <Pencil size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label="Sil" onClick={() => setDel(t)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {view === "program" && (
        <section aria-label="Haftalık program" className="space-y-9">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Ders programım</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setEdit({ id: null, data: blank(today, "class", profile.subjectIds[0] ?? null) })}>
                <Plus size={16} /> Ders ekle
              </button>
            </div>
            <ul className="card hair overflow-hidden">
              {WEEKDAYS_LONG.map((d, wd) => {
                const items = classes.filter((c) => c.weekday === wd).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
                return (
                  <li key={d} className="flex gap-4 px-4 py-3.5">
                    <span className="w-24 shrink-0 pt-0.5 text-sm font-medium text-ink-2">{d}</span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {items.length === 0 && <span className="text-sm text-ink-3">—</span>}
                      {items.map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-[0.93rem]">
                          <span className="w-[92px] shrink-0 tabular-nums text-ink-3">{c.start ? `${c.start}–${c.end}` : "Saat yok"}</span>
                          <span className="min-w-0 flex-1 truncate text-ink">{c.title}</span>
                          <button className="text-ink-3 hover:text-ink" aria-label={`${c.title} dersini düzenle`} onClick={() => setEdit({ id: c.id, data: { ...c } })}>
                            <Pencil size={14} />
                          </button>
                          <button className="text-ink-3 hover:text-danger" aria-label={`${c.title} dersini sil`} onClick={() => setDel(c)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <Availability value={profile.availability} onChange={(v) => void patchProfile({ availability: v })} />
        </section>
      )}

      {/* Düzenleme */}
      <Sheet open={edit !== null} onClose={() => setEdit(null)} title={edit?.id ? "Düzenle" : "Ekle"}>
        {edit && (
          <div className="space-y-4">
            <Segmented value={edit.data.type} onChange={(v) => setEdit({ ...edit, data: { ...edit.data, type: v, weekly: v === "class" } })} options={TYPES} label="Tür" size="sm" />
            <Field label="Başlık" htmlFor="t-title">
              <input id="t-title" data-autofocus className="field" value={edit.data.title} maxLength={120} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, title: e.target.value } })} placeholder={edit.data.type === "exam" ? "Örn. Matematik 1. yazılı" : edit.data.type === "class" ? "Örn. Fizik" : "Örn. Üslü sayılar tekrarı"} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ders" htmlFor="t-sub">
                <select id="t-sub" className="field" value={edit.data.subjectId ?? ""} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, subjectId: e.target.value || null, topicId: null, topicIds: [] } })}>
                  <option value="">Ders yok</option>
                  {profile.subjectIds.map((s) => (
                    <option key={s} value={s}>
                      {subjectName(s)}
                    </option>
                  ))}
                </select>
              </Field>
              {edit.data.type === "class" ? (
                <Field label="Gün" htmlFor="t-wd">
                  <select id="t-wd" className="field" value={edit.data.weekday ?? 0} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, weekday: Number(e.target.value) } })}>
                    {WEEKDAYS_LONG.map((d, i) => (
                      <option key={d} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <Field label={edit.data.type === "homework" ? "Teslim tarihi" : "Tarih"} htmlFor="t-date">
                  <input id="t-date" type="date" className="field" value={edit.data.date} onChange={(e) => e.target.value && setEdit({ ...edit, data: { ...edit.data, date: e.target.value } })} />
                </Field>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Başlangıç (isteğe bağlı)" htmlFor="t-start">
                <input id="t-start" type="time" className="field" value={edit.data.start ?? ""} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, start: e.target.value || null } })} />
              </Field>
              <Field label="Bitiş" htmlFor="t-end">
                <input id="t-end" type="time" className="field" value={edit.data.end ?? ""} onChange={(e) => setEdit({ ...edit, data: { ...edit.data, end: e.target.value || null } })} />
              </Field>
            </div>
            {(edit.data.type === "study" || edit.data.type === "revision") && edit.data.subjectId && (
              <button className="btn btn-secondary btn-sm" onClick={() => setPickTopics("one")}>
                {edit.data.topicId ? topicLabel(edit.data.topicId).slice(0, 44) : "Konu ekle (isteğe bağlı)"}
              </button>
            )}
            {edit.data.type === "exam" && edit.data.subjectId && (
              <button className="btn btn-secondary btn-sm" onClick={() => setPickTopics("many")}>
                {edit.data.topicIds?.length ? `${edit.data.topicIds.length} konu seçili` : "Sınav konularını seç (plan için faydalı)"}
              </button>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost" onClick={() => setEdit(null)}>
                Vazgeç
              </button>
              <button className="btn btn-primary" onClick={() => void save()}>
                Kaydet
              </button>
            </div>
          </div>
        )}
      </Sheet>
      {edit && pickTopics && edit.data.subjectId && (
        <TopicPicker
          open
          onClose={() => setPickTopics(null)}
          bookIds={profile.bookIds.filter((b) => getBook(b)?.subjectId === edit.data.subjectId)}
          value={pickTopics === "one" ? (edit.data.topicId ? [edit.data.topicId] : []) : (edit.data.topicIds ?? [])}
          multiple={pickTopics === "many"}
          onChange={(v) => setEdit({ ...edit, data: pickTopics === "one" ? { ...edit.data, topicId: v[0] ?? null } : { ...edit.data, topicIds: v } })}
        />
      )}

      <GenerateSheet open={gen} onClose={() => setGen(false)} exams={exams.filter((e) => e.date > today)} tasks={tasks.items} attemptsItems={attempts.items} onDone={(n) => toast(`${n} çalışma plana eklendi.`, "ok")} />

      <Sheet open={resched !== null} onClose={() => setReschedOpen(false)} title="Yeniden planlama önerisi" wide>
        {resched && (
          <div className="space-y-4">
            {resched.length === 0 ? (
              <p className="text-ink-2">Yeniden planlanacak görev yok.</p>
            ) : (
              <>
                <ul className="hair">
                  {resched.map((r) => {
                    const t = tasks.items.find((x) => x.id === r.id);
                    if (!t) return null;
                    return (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                        <span className="min-w-0 flex-1 text-[0.95rem] text-ink">{t.title}</span>
                        <span className="text-[13px] text-ink-3">
                          {formatDay(r.from.date)} →{" "}
                          {r.to ? (
                            <strong className="text-ink">
                              {relativeDay(r.to.date)} {r.to.start}
                            </strong>
                          ) : (
                            <span className="text-warn">yer bulunamadı</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {resched.some((r) => !r.to) && <Notice tone="warn">Bazı görevlere uygun boş zaman bulunamadı. “Program” bölümünden çalışma saatlerini genişletebilirsin.</Notice>}
                <div className="flex justify-end gap-2">
                  <button className="btn btn-ghost" onClick={() => setReschedOpen(false)}>
                    Şimdi değil
                  </button>
                  <button
                    className="btn btn-primary"
                    disabled={!resched.some((r) => r.to)}
                    onClick={async () => {
                      for (const r of resched) if (r.to) await update("task", r.id, { date: r.to.date, start: r.to.start, end: r.to.end, status: "todo", note: `Yeniden planlandı (önceki: ${formatDay(r.from.date)})` });
                      toast("Görevler yeniden yerleştirildi.", "ok");
                      setReschedOpen(false);
                    }}
                  >
                    Uygula
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </Sheet>

      <ConfirmSheet
        open={del !== null}
        title="Silinsin mi?"
        text={`“${del?.title}” silinecek.${del?.type === "class" ? " Haftalık dersin tüm tekrarları kalkar." : ""}`}
        confirmLabel="Sil"
        danger
        onClose={() => setDel(null)}
        onConfirm={async () => {
          if (del) await remove("task", del.id);
        }}
      />
    </div>
  );
}

function TaskRow({ t, today, showDate, onToggle, onEdit, onDelete }: { t: TaskRecord; today: string; showDate?: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  const isClass = t.type === "class";
  const overdue = !isClass && t.status === "todo" && t.date < today && t.type !== "exam";
  return (
    <li className="flex items-center gap-3 px-4 py-3.5">
      {isClass || t.type === "exam" ? (
        <span className="grid h-6 w-6 shrink-0 place-items-center text-ink-3" aria-hidden>
          <CalendarDays size={16} />
        </span>
      ) : (
        <button
          role="checkbox"
          aria-checked={t.status === "done"}
          aria-label={`${t.title} tamamlandı`}
          onClick={onToggle}
          className={clsx("grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors", t.status === "done" ? "border-ok bg-ok text-accent-ink" : "border-line-strong hover:border-accent")}
        >
          {t.status === "done" && <Check size={14} strokeWidth={3} />}
        </button>
      )}
      <span className="w-[92px] shrink-0 text-sm tabular-nums text-ink-3">{showDate ? relativeDay(t.date) : t.start ? `${t.start}–${t.end ?? ""}` : "Gün içi"}</span>
      <div className="min-w-0 flex-1">
        <p className={clsx("truncate text-[0.96rem]", t.status === "done" ? "text-ink-3 line-through" : "text-ink")}>{t.title}</p>
        <p className="truncate text-[12.5px] text-ink-3">
          {[t.subjectId ? subjectName(t.subjectId) : null, t.topicId ? topicLabel(t.topicId) : null, t.note].filter(Boolean).join(" · ")}
        </p>
      </div>
      {overdue && <span className="badge badge-warn shrink-0">Kaçtı</span>}
      <span className="badge hidden shrink-0 sm:inline-flex">{t.auto ? "Plan" : TYPE_LABEL[t.type]}</span>
      <button className="text-ink-3 hover:text-ink" aria-label="Düzenle" onClick={onEdit}>
        <Pencil size={15} />
      </button>
      <button className="text-ink-3 hover:text-danger" aria-label="Sil" onClick={onDelete}>
        <Trash2 size={15} />
      </button>
    </li>
  );
}

function Availability({ value, onChange }: { value: DayWindow[]; onChange: (v: DayWindow[]) => void }) {
  const get = (d: number) => value.find((w) => w.day === d);
  return (
    <div>
      <h2 className="mb-1 font-display text-xl text-ink">Çalışabileceğim saatler</h2>
      <p className="mb-3 text-sm text-ink-3">Plan yalnızca buraya yerleştirilir. İstediğin gibi değiştirebilirsin.</p>
      <ul className="card hair overflow-hidden">
        {WEEKDAYS_LONG.map((d, i) => {
          const w = get(i);
          return (
            <li key={d} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <label className="flex w-36 items-center gap-2.5 text-[0.95rem] text-ink">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-[var(--accent)]"
                  checked={Boolean(w)}
                  onChange={(e) => onChange(e.target.checked ? [...value, DEFAULT_AVAILABILITY.find((x) => x.day === i) ?? { day: i, from: "17:00", to: "20:00" }] : value.filter((x) => x.day !== i))}
                />
                {d}
              </label>
              {w && (
                <span className="flex items-center gap-2 text-sm text-ink-2">
                  <input type="time" className="field w-[112px] py-1.5" value={w.from} aria-label={`${d} başlangıç`} onChange={(e) => onChange(value.map((x) => (x.day === i ? { ...x, from: e.target.value } : x)))} />–
                  <input type="time" className="field w-[112px] py-1.5" value={w.to} aria-label={`${d} bitiş`} onChange={(e) => onChange(value.map((x) => (x.day === i ? { ...x, to: e.target.value } : x)))} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GenerateSheet({ open, onClose, exams, tasks, attemptsItems, onDone }: { open: boolean; onClose: () => void; exams: TaskRecord[]; tasks: TaskRecord[]; attemptsItems: import("@/lib/types").AttemptRecord[]; onDone: (n: number) => void }) {
  const { profile } = useApp();
  const { create } = useStoreCtx();
  const [examId, setExamId] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const [topicIds, setTopicIds] = useState<string[]>([]);
  const [pick, setPick] = useState(false);
  const [preview, setPreview] = useState<{ tasks: NewTask[]; unplaced: PlanTopic[]; days: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const today = toDay();
  const exam = exams.find((e) => e.id === examId) ?? null;
  const stats = useMemo(() => topicStats(attemptsItems), [attemptsItems]);

  const subj = subject || exam?.subjectId || profile?.subjectIds[0] || "";
  const effective = exam?.topicIds?.length && !topicIds.length ? exam.topicIds : topicIds;

  function build() {
    if (!profile) return;
    const topics: PlanTopic[] = effective
      .map((id) => ({ id, r: resolveTopic(id) }))
      .filter((x) => x.r)
      .map(({ id, r }) => ({ topicId: id, subjectId: r!.book.subjectId, title: topicLabel(id), weight: levelOf(stats.get(id)) === "review" ? 2 : 1 }));
    setPreview(generatePlan({ today, availability: profile.availability, existing: tasks, topics, examDate: exam?.date ?? null, now: Date.now() }));
  }

  if (!profile) return null;
  return (
    <Sheet open={open} onClose={() => (setPreview(null), onClose())} title="Çalışma planı oluştur" wide>
      <div className="space-y-4">
        <p className="text-[0.95rem] leading-relaxed text-ink-2">
          Konuları boş saatlerine, günde en fazla {2}–{3} kısa oturumla yerleştiririz. Tekrar önerilen konular (yeterli kanıt varsa) iki kez çalışılır. Onaylamadan hiçbir şey eklenmez.
        </p>
        <Field label="Hedef sınav (isteğe bağlı)" htmlFor="g-exam" hint={exams.length ? undefined : "Önce Sınavlar bölümüne bir sınav tarihi ekleyebilirsin; yoksa önümüzdeki 14 gün için plan yapılır."}>
          <select id="g-exam" className="field" value={examId} onChange={(e) => (setExamId(e.target.value), setTopicIds([]), setPreview(null))}>
            <option value="">Sınav yok — önümüzdeki 14 gün</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title} · {formatDay(e.date)}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Ders" htmlFor="g-sub">
            <select id="g-sub" className="field" value={subj} onChange={(e) => (setSubject(e.target.value), setTopicIds([]), setPreview(null))}>
              {profile.subjectIds.map((s) => (
                <option key={s} value={s}>
                  {subjectName(s)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Konular">
            <button className="field flex items-center justify-between text-left" onClick={() => setPick(true)}>
              <span className={clsx(!effective.length && "text-ink-3")}>{effective.length ? `${effective.length} konu` : "Konu seç"}</span>
              <Sparkles size={16} className="text-ink-3" />
            </button>
          </Field>
        </div>
        <div className="flex justify-end">
          <button className="btn btn-secondary" disabled={!effective.length} onClick={build}>
            Planı göster
          </button>
        </div>
        {preview && (
          <div className="anim-rise space-y-3 border-t border-line pt-4">
            {preview.tasks.length === 0 ? (
              <Notice tone="warn">Bu aralıkta boş zaman bulunamadı. “Program” bölümünden çalışma saatlerini genişletmeyi dene.</Notice>
            ) : (
              <ul className="max-h-72 space-y-1.5 overflow-y-auto text-[0.92rem]">
                {preview.tasks.map((t, i) => (
                  <li key={i} className="flex items-baseline gap-3">
                    <span className="w-28 shrink-0 text-ink-3">{relativeDay(t.date)} {t.start}</span>
                    <span className="min-w-0 flex-1 text-ink">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
            {preview.unplaced.length > 0 && <Notice tone="warn" title={`${preview.unplaced.length} oturum sığmadı`}>Günlük yükü sınırlı tuttuğumuz için bazı konular yerleştirilemedi: {preview.unplaced.slice(0, 3).map((t) => t.title).join("; ")}{preview.unplaced.length > 3 ? "…" : ""}</Notice>}
            <div className="flex justify-end">
              <button
                className="btn btn-primary"
                disabled={busy || preview.tasks.length === 0}
                onClick={async () => {
                  setBusy(true);
                  for (const t of preview.tasks) await create("task", t);
                  setBusy(false);
                  onDone(preview.tasks.length);
                  setPreview(null);
                  onClose();
                }}
              >
                Plana ekle ({preview.tasks.length})
              </button>
            </div>
          </div>
        )}
      </div>
      <TopicPicker open={pick} onClose={() => setPick(false)} bookIds={profile.bookIds.filter((b) => getBook(b)?.subjectId === subj)} value={effective} onChange={(v) => (setTopicIds(v), setPreview(null))} multiple title="Plan konuları" />
    </Sheet>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={null}>
      <Planner />
    </Suspense>
  );
}
