"use client";

import { Download, Plus, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { snapshot, useStore } from "@/lib/store";
import { CATEGORIES, type Category, type HabitKind } from "@/lib/types";

export default function SettingsPage() {
  const { profile, habits, setProfile, addHabit, updateHabit, removeHabit, importData, reset } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [h, setH] = useState({ question: "", name: "", kind: "toggle" as HabitKind, category: "saglik" as Category });
  const [msg, setMsg] = useState("");

  const exportJson = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot(), null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `alp-book-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (f?: File) => {
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d?.profile || !Array.isArray(d.habits)) throw new Error();
      importData(d);
      setMsg("Yedek yüklendi.");
    } catch {
      setMsg("Dosya geçersiz.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="label">Ayarlar</p>
        <h1 className="mt-1 text-3xl font-bold">Defteri <span className="text-neon text-glow">Düzenle</span></h1>
      </header>

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold">Profil</h2>
        <label className="label">Adın</label>
        <input className="input mt-2" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
        {profile.ais.length > 0 && <p className="mt-3 text-xs text-mute">Yapay zekalar: {profile.ais.join(", ")}</p>}
        {profile.fitness.length > 0 && <p className="mt-1 text-xs text-mute">Fitness: {profile.fitness.join(", ")}</p>}
        {profile.focus.length > 0 && <p className="mt-1 text-xs text-mute">Odak: {profile.focus.join(", ")}</p>}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold">Alışkanlıklar</h2>
        <div className="space-y-2">
          {habits.map((x) => (
            <div key={x.id} className="flex items-center gap-2 rounded-xl border border-line bg-black/40 p-2">
              <i className="ml-1 h-8 w-1 rounded-full" style={{ background: CATEGORIES[x.category].color }} />
              <input className="input !border-transparent !bg-transparent !py-2" value={x.question} onChange={(e) => updateHabit(x.id, { question: e.target.value })} />
              <span className="hidden whitespace-nowrap font-mono text-[10px] text-mute sm:block">{x.kind === "avoid" ? "kaçamak" : "yap"}</span>
              <button className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-mute hover:text-danger" onClick={() => confirm("Bu alışkanlık silinsin mi?") && removeHabit(x.id)} aria-label="Sil"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>

        <form
          className="mt-5 grid grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!h.question.trim()) return;
            addHabit({ ...h, name: h.name.trim() || h.question.trim().slice(0, 24), question: h.question.trim() });
            setH({ ...h, question: "", name: "" });
          }}
        >
          <input className="input col-span-2" placeholder="Yeni kart sorusu (ör. 2 litre su içtin mi?)" value={h.question} onChange={(e) => setH({ ...h, question: e.target.value })} />
          <input className="input col-span-2" placeholder="Kısa ad (matris için, opsiyonel)" value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} />
          <select className="input" value={h.kind} onChange={(e) => setH({ ...h, kind: e.target.value as HabitKind })}>
            <option value="toggle">Yapılacak (evet = başarı)</option>
            <option value="avoid">Kaçınılacak (hayır = başarı)</option>
          </select>
          <select className="input" value={h.category} onChange={(e) => setH({ ...h, category: e.target.value as Category })}>
            {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <button className="btn btn-neon col-span-2"><Plus size={16} /> Alışkanlık ekle</button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold">Veri</h2>
        <p className="mb-4 text-xs text-mute">Veriler yalnızca bu cihazın tarayıcısında saklanır. Telefon ve bilgisayar arasında taşımak için yedek al / yükle.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost" onClick={exportJson}><Download size={16} /> Yedek al</button>
          <button className="btn btn-ghost" onClick={() => file.current?.click()}><Upload size={16} /> Yedek yükle</button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { importJson(e.target.files?.[0]); e.target.value = ""; }} />
          <button className="btn btn-ghost !text-danger" onClick={() => confirm("TÜM veriler silinecek. Emin misin?") && reset()}><Trash2 size={16} /> Sıfırla</button>
        </div>
        {msg && <p className="mt-3 text-xs text-neon">{msg}</p>}
      </section>
    </div>
  );
}
