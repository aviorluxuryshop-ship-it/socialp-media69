"use client";

import { Plus, Sparkles } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { inferRoutine, type CustomKind } from "@/lib/infer";
import { sfx } from "@/lib/sound";
import { useStore } from "@/lib/store";
import { Segmented } from "./ui";

const KIND_LABEL: Record<CustomKind, string> = { yesno: "Evet / Hayır", number: "Sayı", time: "Saat" };

/**
 * Rutin ekleme: yazdığın cümleden giriş türü (Evet/Hayır, sayı + birim, saat), birim, hedef, simge ve kısa ad
 * otomatik algılanır. İstersen her birini değiştirebilirsin.
 */
export function AddRoutineForm({ onAdded }: { onAdded?: () => void }) {
  const addRoutine = useStore((s) => s.addRoutine);
  const [text, setText] = useState("");
  const [kind, setKind] = useState<CustomKind | null>(null);
  const [unit, setUnit] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [dir, setDir] = useState<"min" | "max" | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [emoji, setEmoji] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const inf = useMemo(() => inferRoutine(text), [text]);
  const k = kind ?? inf.kind;
  const u = unit ?? inf.unit ?? "";
  const g = goal ?? (inf.goal !== undefined ? String(inf.goal) : "");
  const d = dir ?? inf.goalDir;
  const l = label ?? inf.label;
  const e = emoji ?? inf.emoji;
  const goalNum = g.trim() === "" ? undefined : Number(g.replace(",", "."));
  const goalBad = goalNum !== undefined && (Number.isNaN(goalNum) || goalNum <= 0);
  const canAdd = text.trim() !== "" && l.trim() !== "" && !goalBad;

  function reset() {
    setText("");
    setKind(null);
    setUnit(null);
    setGoal(null);
    setDir(null);
    setLabel(null);
    setEmoji(null);
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!canAdd) return;
    const id = addRoutine({
      emoji: e.trim() || "📌",
      label: l,
      question: text.trim(),
      kind: k,
      ...(k === "number" ? { unit: u.trim() || undefined, ...(goalNum !== undefined ? { goal: goalNum, goalDir: d } : {}) } : {}),
    });
    if (!id) return;
    sfx.add();
    setDone(`“${l}” eklendi (${KIND_LABEL[k]}${k === "number" && u ? `, ${u}` : ""}). Takip tablosunda en altta.`);
    reset();
    input.current?.focus();
    onAdded?.();
  }

  return (
    <form onSubmit={submit} aria-label="Yeni rutin ekle" className="space-y-3">
      <div>
        <label htmlFor="routine-text" className="eyebrow block">Rutin</label>
        <input
          id="routine-text"
          ref={input}
          className="input mt-2"
          placeholder="Örn: Kitap okudun mu? · Kaç bardak su içtin? · Saat kaçta kalktın?"
          value={text}
          maxLength={140}
          onChange={(ev) => {
            setText(ev.target.value);
            setDone(null);
          }}
        />
        <p className="mt-1.5 text-[12px] text-mute">Sorunu ya da adını yaz; türü, birimi ve hedefi sistem tahmin eder.</p>
      </div>

      {text.trim() !== "" && (
        <div className="space-y-3 rounded-xl border border-line bg-ink/50 p-3.5">
          <p className="flex items-center gap-2 text-[12.5px] text-mute">
            <Sparkles size={14} className="text-accent" />
            Algılanan: <b className="text-text">{KIND_LABEL[inf.kind]}{inf.kind === "number" && inf.unit ? ` · ${inf.unit}` : ""}{inf.kind === "number" && inf.goal ? ` · hedef ${inf.goal}` : ""}</b>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented label="Giriş türü" size="sm" value={k} onChange={(v) => setKind(v)} options={[{ value: "yesno", label: "Evet / Hayır" }, { value: "number", label: "Sayı" }, { value: "time", label: "Saat" }]} />
          </div>
          {k === "number" && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="block text-[12px] text-mute">
                Birim
                <input className="input !min-h-[40px] mt-1 w-28" value={u} placeholder="bardak, dk…" maxLength={12} onChange={(ev) => setUnit(ev.target.value)} aria-label="Birim" />
              </label>
              <label className="block text-[12px] text-mute">
                Hedef (isteğe bağlı)
                <input className="input num !min-h-[40px] mt-1 w-28" inputMode="decimal" value={g} placeholder="—" aria-invalid={goalBad || undefined} onChange={(ev) => setGoal(ev.target.value.replace(/[^\d.,]/g, ""))} aria-label="Hedef" />
              </label>
              {goalNum !== undefined && !goalBad && (
                <Segmented label="Hedef yönü" size="sm" value={d} onChange={(v) => setDir(v)} options={[{ value: "min", label: "En az" }, { value: "max", label: "En fazla" }]} />
              )}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-[12px] text-mute">
              Tabloda görünen ad
              <input className="input !min-h-[40px] mt-1 w-48" value={l} maxLength={30} onChange={(ev) => setLabel(ev.target.value)} aria-label="Kısa ad" />
            </label>
            <label className="block text-[12px] text-mute">
              Simge
              <input className="input !min-h-[40px] mt-1 w-16 text-center" value={e} maxLength={4} onChange={(ev) => setEmoji(ev.target.value)} aria-label="Simge" />
            </label>
          </div>
          {k === "number" && goalNum === undefined && <p className="text-[12px] text-faint">Hedef girmezsen değerler yalnızca kaydedilir; yüzdeye katılmaz.</p>}
          {goalBad && <p role="alert" className="text-[12px] text-rose">Hedef sıfırdan büyük bir sayı olmalı.</p>}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={!canAdd}>
          <Plus size={16} /> Rutini ekle
        </button>
        {done && <p role="status" className="text-[13px] text-accent">{done}</p>}
      </div>
    </form>
  );
}
