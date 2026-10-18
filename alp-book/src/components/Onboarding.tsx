"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { AI_OPTIONS, FITNESS_OPTIONS, FOCUS_OPTIONS } from "@/lib/defaults";
import { useStore } from "@/lib/store";

const STEPS = ["Sen", "Yapay zeka", "Fitness", "Odak"] as const;

export function Onboarding() {
  const finish = useStore((s) => s.finishOnboarding);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Efehan");
  const [ais, setAis] = useState<string[]>(["Claude"]);
  const [fitness, setFitness] = useState<string[]>([]);
  const [focus, setFocus] = useState<string[]>(["Dersler", "Kodlama", "Beslenme"]);
  const [customAi, setCustomAi] = useState("");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const last = step === STEPS.length - 1;
  const next = () => (last ? finish({ name, ais, fitness, focus }) : setStep(step + 1));

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black safe-top">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pb-8 pt-8">
        <div className="mb-8 flex items-center justify-between">
          <p className="font-mono text-sm font-bold tracking-[0.3em] text-neon text-glow">ALP BOOK</p>
          <p className="font-mono text-xs text-mute">{step + 1}/{STEPS.length}</p>
        </div>
        <div className="mb-8 flex gap-1.5">
          {STEPS.map((s, i) => (
            <motion.span key={s} className="h-1 flex-1 rounded-full" animate={{ background: i <= step ? "#00ff66" : "#222", boxShadow: i <= step ? "0 0 8px #00ff66aa" : "none" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="flex-1">
            {step === 0 && (
              <>
                <h1 className="text-4xl font-bold leading-tight">Hoş geldin.<br /><span className="text-neon text-glow">Defterin hazır.</span></h1>
                <p className="mt-3 text-mute">Alışkanlıklarını, serilerini ve sınavlarını tek yerde tutan kişisel sistemin. Birkaç soruyla sana göre kuralım.</p>
                <label className="label mt-8 block">Adın</label>
                <input className="input mt-2" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
              </>
            )}
            {step === 1 && (
              <Pick title="Hangi yapay zekaları kullanıyorsun?" hint="Birden fazla seçebilirsin." options={AI_OPTIONS} value={ais} onToggle={(v) => toggle(ais, setAis, v)}>
                <form
                  className="mt-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = customAi.trim();
                    if (v && !ais.includes(v)) setAis([...ais, v]);
                    setCustomAi("");
                  }}
                >
                  <input className="input" placeholder="Başka bir araç ekle…" value={customAi} onChange={(e) => setCustomAi(e.target.value)} />
                  <button className="btn btn-ghost">Ekle</button>
                </form>
                {ais.filter((a) => !AI_OPTIONS.includes(a)).map((a) => <Chip key={a} on label={a} onClick={() => toggle(ais, setAis, a)} />)}
              </Pick>
            )}
            {step === 2 && (
              <Pick title="Fitness / boks rutinin ne?" hint="Seçtiğin ilk antrenman günlük karta dönüşür. Boş bırakabilirsin." options={FITNESS_OPTIONS} value={fitness} onToggle={(v) => toggle(fitness, setFitness, v)} />
            )}
            {step === 3 && (
              <Pick title="Günlük odak alanların?" hint="Her biri için takip kartı oluşturulur." options={FOCUS_OPTIONS.map((f) => f.label)} value={focus} onToggle={(v) => toggle(focus, setFocus, v)} />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex gap-3">
          {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(step - 1)}>Geri</button>}
          <button className="btn btn-neon flex-1" onClick={next}>
            {last ? "Alp Book'u Aç" : "Devam"} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Pick({ title, hint, options, value, onToggle, children }: { title: string; hint: string; options: string[]; value: string[]; onToggle: (v: string) => void; children?: React.ReactNode }) {
  return (
    <>
      <h2 className="text-3xl font-bold leading-tight">{title}</h2>
      <p className="mt-2 text-sm text-mute">{hint}</p>
      <div className="mt-6 flex flex-wrap gap-2.5">
        {options.map((o) => <Chip key={o} label={o} on={value.includes(o)} onClick={() => onToggle(o)} />)}
      </div>
      {children}
    </>
  );
}

function Chip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="mr-2 mt-2 inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium"
      style={on ? { borderColor: "#00ff66", background: "rgba(0,255,102,.12)", color: "#00ff66", boxShadow: "0 0 16px -4px #00ff66" } : { borderColor: "#2a2a2a", background: "#0e0e0e", color: "#d4d4d8" }}
    >
      {on && <Check size={14} strokeWidth={3} />} {label}
    </motion.button>
  );
}
