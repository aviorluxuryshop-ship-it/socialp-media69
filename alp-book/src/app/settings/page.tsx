"use client";

import { Download, Trash2, Upload, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";
import { NumberField } from "@/components/track/fields";
import { SectionHead } from "@/components/ui";
import { normalizeData } from "@/lib/normalize";
import { GROUPS, ROUTINES } from "@/lib/routines";
import { sfx } from "@/lib/sound";
import { snapshot, useStore } from "@/lib/store";
import { todayKey } from "@/lib/dates";
import type { AppData } from "@/lib/types";

interface Pending {
  data: AppData;
  dropped: number;
  days: number;
  values: number;
  fileName: string;
}

const countValues = (d: AppData) => Object.values(d.entries).reduce((a, e) => a + Object.keys(e).length, 0);

function merge(cur: AppData, inc: AppData): AppData {
  const entries = { ...cur.entries };
  for (const [day, e] of Object.entries(inc.entries)) entries[day] = { ...(entries[day] ?? {}), ...e };
  const byId = <T extends { id: string }>(a: T[], b: T[]) => [...a, ...b.filter((x) => !a.some((y) => y.id === x.id))];
  return { ...cur, entries, courses: byId(cur.courses, inc.courses), exams: byId(cur.exams, inc.exams), plans: byId(cur.plans, inc.plans), legacy: cur.legacy ?? inc.legacy };
}

export default function SettingsPage() {
  const { profile, goals, entries, setProfile, setGoals, replaceData, reset } = useStore();
  const file = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const days = Object.keys(entries).length;
  const values = countValues(snapshot());

  const exportJson = () => {
    const payload = { app: "alp-book", version: 2, exportedAt: new Date().toISOString(), data: snapshot() };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `alp-book-yedek-${todayKey()}.json` });
    a.click();
    URL.revokeObjectURL(url);
    setMsg({ ok: true, text: "Yedek dosyası indirildi." });
  };

  const readFile = async (f?: File) => {
    if (!f) return;
    try {
      const n = normalizeData(JSON.parse(await f.text()));
      if (!n) throw new Error("format");
      setPending({ data: n.data, dropped: n.dropped, days: Object.keys(n.data.entries).length, values: countValues(n.data), fileName: f.name });
      setMsg(null);
    } catch {
      setPending(null);
      setMsg({ ok: false, text: "Dosya okunamadı. Alp Book'tan alınmış bir .json yedeği seçtiğinden emin ol. Mevcut verilerine dokunulmadı." });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="eyebrow">Ayarlar</p>
        <h1 className="h-title mt-1 text-[28px] md:text-[32px]">Tercihler ve veri</h1>
      </header>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Profil" />
        <label className="eyebrow" htmlFor="pname">Adın</label>
        <input id="pname" className="input mt-2 max-w-sm" value={profile.name} maxLength={40} onChange={(e) => setProfile({ name: e.target.value })} onBlur={(e) => !e.target.value.trim() && setProfile({ name: "Efehan" })} />
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Ses efektleri" />
        <p className="mb-4 text-[13px] leading-relaxed text-mute">Yumuşak, sakin tınılar: işaretlerken, plan eklerken ve sayfalar arasında geçerken çalar. Telefonda sessiz modundaysa duyulmayabilir.</p>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" role="switch" aria-checked={profile.soundOn} onClick={() => { setProfile({ soundOn: !profile.soundOn }); if (!profile.soundOn) sfx.preview(); }} className="btn btn-quiet">
            {profile.soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />} {profile.soundOn ? "Sesler açık" : "Sesler kapalı"}
          </button>
          <label className="flex min-w-[200px] flex-1 items-center gap-3 text-[13px] text-mute">
            Seviye
            <input type="range" min={0.1} max={1} step={0.05} value={profile.volume} disabled={!profile.soundOn} aria-label="Ses seviyesi" onChange={(e) => setProfile({ volume: Number(e.target.value) })} onPointerUp={() => sfx.preview()} onKeyUp={() => sfx.preview()} className="h-1.5 flex-1 cursor-pointer accent-[#00ff66] disabled:opacity-40" />
          </label>
          <button type="button" className="btn btn-quiet btn-sm" disabled={!profile.soundOn} onClick={() => sfx.preview()}>Dinle</button>
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Hedefler" />
        <p className="mb-4 text-[13px] leading-relaxed text-mute">
          Su, uyku, ekran ve yürüyüş için "hedefte" sayılma ölçüleri. Tamamlanma yüzdesi bu hedeflere göre hesaplanır; yalnızca kaydettiğin günler hesaba katılır. Değiştirdiğinde geçmiş yüzdeler de yeni hedefe göre yeniden hesaplanır.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Goal label="Günlük su" suffix="bardak" value={goals.waterGlasses} max={40} onChange={(n) => setGoals({ waterGlasses: n })} />
          <Goal label="Uyku (en az)" suffix="saat" value={goals.sleepHours} max={16} onChange={(n) => setGoals({ sleepHours: n })} />
          <Goal label="Ekran süresi (en fazla)" suffix="saat" value={goals.screenMaxHours} max={24} onChange={(n) => setGoals({ screenMaxHours: n })} />
          <Goal label="Günlük adım" suffix="adım" value={goals.steps} max={100000} onChange={(n) => setGoals({ steps: n })} />
          <Goal label="Günlük yürüyüş süresi" suffix="dk" value={goals.walkMinutes} max={1440} onChange={(n) => setGoals({ walkMinutes: n })} />
        </div>
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Rutinler" />
        <p className="mb-3 text-[13px] text-mute">Varsayılan liste ve sıra sabittir.</p>
        <ol className="divide-hair rounded-xl border border-line">
          {ROUTINES.map((r, i) => (
            <li key={r.id} className="flex items-center gap-3 px-3.5 py-2.5 text-[13px]">
              <span className="num w-5 text-faint">{i + 1}</span>
              <span aria-hidden>{r.emoji}</span>
              <span className="min-w-0 flex-1 truncate">{r.question}</span>
              <span className="hidden text-[11px] text-faint sm:block">{GROUPS[r.group].label}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Yedekleme" />
        <p className="mb-1 text-[13px] leading-relaxed text-mute">
          Veriler yalnızca bu cihazın tarayıcısında saklanır; cihazlar arasında otomatik eşitlenmez. Telefon ve bilgisayar arasında taşımak için yedek al ve diğer cihazda yükle.
        </p>
        <p className="mb-4 text-[12px] text-faint num">Şu an: {days} gün, {values} kayıt.</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-quiet" onClick={exportJson}><Download size={16} /> Yedek al</button>
          <button className="btn btn-quiet" onClick={() => file.current?.click()}><Upload size={16} /> Yedek yükle</button>
          <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ""; }} />
        </div>

        {pending && (
          <div className="mt-4 rounded-xl border border-line-2 bg-ink/60 p-4" role="group" aria-label="Yedek yükleme onayı">
            <p className="text-[14px] font-medium">{pending.fileName}</p>
            <p className="mt-1 text-[13px] text-mute num">{pending.days} gün, {pending.values} kayıt bulundu{pending.dropped > 0 && ` · ${pending.dropped} geçersiz değer atlanacak`}.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" onClick={() => { replaceData(merge(snapshot(), pending.data)); setPending(null); setMsg({ ok: true, text: "Yedek mevcut verilerle birleştirildi. Aynı gün ve rutinde dosyadaki değer geçerli oldu." }); }}>Birleştir (önerilen)</button>
              <button className="btn btn-quiet btn-sm" onClick={() => { replaceData(pending.data); setPending(null); setMsg({ ok: true, text: "Yedek yüklendi; önceki veriler yedekle değiştirildi." }); }}>Mevcut verinin yerine koy</button>
              <button className="btn btn-quiet btn-sm" onClick={() => setPending(null)}>Vazgeç</button>
            </div>
          </div>
        )}
        {msg && <p role="status" className={`mt-3 text-[13px] ${msg.ok ? "text-accent" : "text-rose"}`}>{msg.text}</p>}
      </section>

      <section className="panel p-5 sm:p-6">
        <SectionHead title="Tehlikeli bölge" />
        {!confirmReset ? (
          <button className="btn btn-quiet !text-rose" onClick={() => setConfirmReset(true)}><Trash2 size={16} /> Tüm verileri sil</button>
        ) : (
          <div className="rounded-xl border border-rose/40 bg-rose/[0.05] p-4">
            <p className="text-[14px] font-medium">Tüm kayıtlar, hedefler ve sınavlar silinecek. Bu işlem geri alınamaz.</p>
            <p className="mt-1 text-[13px] text-mute">Önce "Yedek al" ile bir kopya indirmeni öneririz.</p>
            <div className="mt-3 flex gap-2">
              <button className="btn btn-sm !bg-rose !text-black" onClick={() => { reset(); setConfirmReset(false); }}>Evet, hepsini sil</button>
              <button className="btn btn-quiet btn-sm" onClick={() => setConfirmReset(false)}>Vazgeç</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Goal({ label, suffix, value, max, onChange }: { label: string; suffix: string; value: number; max: number; onChange: (n: number) => void }) {
  return (
    <div>
      <p className="eyebrow mb-2">{label}</p>
      <NumberField label={label} value={value} min={1} max={max} suffix={suffix} width="w-28" onCommit={(n) => n !== undefined && onChange(n)} />
    </div>
  );
}
