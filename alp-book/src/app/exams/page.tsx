"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ExpectActual } from "@/components/charts/ExpectActual";
import { examInsight } from "@/components/ExamPanel";
import { daysBetween, prettyDate, todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";

const COLORS = ["#00ff66", "#8a2be2", "#38bdf8", "#ff3b6b", "#ffb020", "#2dd4bf"];
const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.min(100, Number(v))));

export default function ExamsPage() {
  const { courses, exams, addCourse, removeCourse, addExam, updateExam, removeExam } = useStore();
  const today = todayKey();
  const [course, setCourse] = useState("");
  const [f, setF] = useState({ courseId: "", title: "Vize", date: today, expected: "" });
  const sorted = [...exams].sort((a, b) => a.date.localeCompare(b.date));
  const insight = examInsight(exams);
  const cid = f.courseId || courses[0]?.id || "";

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <header>
        <p className="label">Dersler & Sınavlar</p>
        <h1 className="mt-1 text-3xl font-bold">Beklenti <span className="text-neon text-glow">Analizi</span></h1>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card card-violet p-5">
          <h2 className="mb-5 text-lg font-semibold">Beklentim vs Gerçekleşen</h2>
          <ExpectActual exams={exams} courses={courses} />
          {insight && (
            <p className="mt-4 font-mono text-sm">
              Ortalama fark: <b style={{ color: insight.avg >= 0 ? "#00ff66" : "#ff3b6b" }}>{insight.avg >= 0 ? "+" : ""}{insight.avg} puan</b>
            </p>
          )}
        </section>

        <section className="card p-5">
          <h2 className="mb-4 text-lg font-semibold">Dersler</h2>
          <form
            className="mb-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!course.trim()) return;
              addCourse(course, COLORS[courses.length % COLORS.length]);
              setCourse("");
            }}
          >
            <input className="input" placeholder="Ders adı (ör. Veri Yapıları)" value={course} onChange={(e) => setCourse(e.target.value)} />
            <button className="btn btn-neon !px-4" aria-label="Ders ekle"><Plus size={18} /></button>
          </form>
          <div className="flex flex-wrap gap-2">
            {courses.map((c) => (
              <span key={c.id} className="flex items-center gap-2 rounded-full border border-line bg-black/40 py-1.5 pl-3 pr-1.5 text-sm">
                <i className="h-2.5 w-2.5 rounded-full" style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }} />
                {c.name}
                <button className="grid h-6 w-6 place-items-center rounded-full text-mute hover:text-danger" onClick={() => confirm(`${c.name} ve sınavları silinsin mi?`) && removeCourse(c.id)} aria-label="Dersi sil"><Trash2 size={13} /></button>
              </span>
            ))}
            {!courses.length && <p className="text-sm text-mute">Önce bir ders ekle.</p>}
          </div>

          <h2 className="mb-3 mt-7 text-lg font-semibold">Sınav ekle</h2>
          <form
            className="grid grid-cols-2 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!cid) return;
              addExam({ courseId: cid, title: f.title || "Sınav", date: f.date, expected: num(f.expected), actual: null });
              setF({ ...f, expected: "" });
            }}
          >
            <select className="input col-span-2" value={cid} onChange={(e) => setF({ ...f, courseId: e.target.value })}>
              {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Vize, Final…" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <input className="input" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />
            <input className="input col-span-2" inputMode="numeric" placeholder="Beklentim (0-100)" value={f.expected} onChange={(e) => setF({ ...f, expected: e.target.value.replace(/\D/g, "") })} />
            <button className="btn btn-neon col-span-2" disabled={!cid}><Plus size={16} /> Sınavı ekle</button>
          </form>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold">Tüm Sınavlar</h2>
        {!sorted.length && <p className="text-sm text-mute">Henüz sınav yok.</p>}
        <div className="space-y-2">
          {sorted.map((e) => {
            const c = courses.find((x) => x.id === e.courseId);
            const left = daysBetween(today, e.date);
            const past = left < 0;
            return (
              <div key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-black/40 p-3">
                <span className="h-10 w-1 rounded-full" style={{ background: c?.color }} />
                <div className="min-w-[140px] flex-1">
                  <p className="text-sm font-semibold">{c?.name} · {e.title}</p>
                  <p className="text-[11px] text-mute">{prettyDate(e.date)} · {past ? "geçti" : left === 0 ? "bugün" : `${left} gün kaldı`}</p>
                </div>
                <label className="flex flex-col gap-1 text-[10px] text-mute">Beklenti
                  <input className="input !w-20 !py-2 text-center font-mono" inputMode="numeric" value={e.expected ?? ""} onChange={(ev) => updateExam(e.id, { expected: num(ev.target.value.replace(/\D/g, "")) })} />
                </label>
                <label className="flex flex-col gap-1 text-[10px] text-mute">Gerçekleşen
                  <input className="input !w-20 !py-2 text-center font-mono" inputMode="numeric" placeholder={past ? "?" : "-"} value={e.actual ?? ""} onChange={(ev) => updateExam(e.id, { actual: num(ev.target.value.replace(/\D/g, "")) })} />
                </label>
                <button className="grid h-9 w-9 place-items-center rounded-lg text-mute hover:text-danger" onClick={() => removeExam(e.id)} aria-label="Sınavı sil"><Trash2 size={16} /></button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
