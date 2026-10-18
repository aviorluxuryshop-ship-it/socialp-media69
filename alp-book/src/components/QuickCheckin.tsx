"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Code2, Dumbbell, Flame, GraduationCap, HeartPulse, Sparkles, Utensils, X } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { habitStreak, isAnswered, isSuccess } from "@/lib/stats";
import { CATEGORIES, type Category, type Habit } from "@/lib/types";
import { Burst } from "./Burst";

const ICONS: Record<Category, typeof Check> = {
  saglik: HeartPulse,
  kod: Code2,
  ders: GraduationCap,
  fitness: Dumbbell,
  beslenme: Utensils,
  hijyen: Sparkles,
  diger: Flame,
};

export function QuickCheckin({ date }: { date: string }) {
  const habits = useStore((s) => s.habits);
  const log = useStore((s) => s.logs[date]);
  const logs = useStore((s) => s.logs);
  const setValue = useStore((s) => s.setValue);
  const setMeal = useStore((s) => s.setMeal);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <MealCard value={log?.meal ?? ""} onChange={(v) => setMeal(date, v)} />
      {habits.map((h) => (
        <HabitCard
          key={h.id}
          habit={h}
          ok={isSuccess(h, log)}
          answered={isAnswered(h, log)}
          streak={habitStreak(h, logs, date)}
          onSet={(v) => setValue(date, h.id, v)}
        />
      ))}
    </div>
  );
}

function MealCard({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="card p-4 sm:col-span-2 xl:col-span-1" style={{ borderColor: value ? "rgba(255,176,32,.4)" : undefined }}>
      <div className="mb-2 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber/15 text-amber"><Utensils size={18} /></span>
        <p className="text-[15px] font-semibold">Bugün ne yedin?</p>
      </div>
      <textarea
        className="input min-h-[76px] resize-none"
        placeholder="Kahvaltı, öğle, akşam… serbest not"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    </div>
  );
}

function HabitCard({ habit, ok, answered, streak, onSet }: { habit: Habit; ok: boolean; answered: boolean; streak: number; onSet: (v: boolean | undefined) => void }) {
  const [burst, setBurst] = useState(0);
  const cat = CATEGORIES[habit.category];
  const Icon = ICONS[habit.category];
  const slipped = habit.kind === "avoid" && answered && !ok;

  const fire = (v: boolean | undefined, success: boolean) => {
    onSet(v);
    if (success) setBurst((b) => b + 1);
  };

  const accent = slipped ? "#ff3b6b" : cat.color;

  return (
    <motion.div
      layout
      className="card p-4"
      animate={{ borderColor: ok ? `${accent}88` : slipped ? "#ff3b6b66" : "#242424", boxShadow: ok ? `0 0 26px -8px ${accent}` : "0 0 0 transparent" }}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl" style={{ background: `${accent}22`, color: accent }}>
          <Icon size={18} />
        </span>
        <p className="flex-1 text-[15px] font-semibold leading-tight">{habit.question}</p>
        {streak > 1 && (
          <span className="flex items-center gap-1 font-mono text-xs font-bold text-amber"><Flame size={13} /> {streak}</span>
        )}
      </div>

      {habit.kind === "toggle" ? (
        <button
          onClick={() => fire(ok ? undefined : true, !ok)}
          className="btn relative w-full overflow-visible"
          style={ok ? { background: cat.color, color: "#00140a", boxShadow: `0 0 22px -4px ${cat.color}` } : { background: "#0c0c0c", border: "1px solid #2a2a2a" }}
        >
          {ok ? <Check size={18} strokeWidth={3} /> : null}
          {ok ? "Tamamlandı" : "Yaptım"}
          <AnimatePresence>{burst > 0 && ok && <Burst key={burst} color={cat.color} radius={34} />}</AnimatePresence>
        </button>
      ) : (
        <div className="relative grid grid-cols-2 gap-2">
          <button
            onClick={() => fire(ok ? undefined : false, !ok)}
            className="btn"
            style={ok ? { background: cat.color, color: "#00140a", boxShadow: `0 0 22px -4px ${cat.color}` } : { background: "#0c0c0c", border: "1px solid #2a2a2a" }}
          >
            {ok && <Check size={16} strokeWidth={3} />} Hayır, temiz
          </button>
          <button
            onClick={() => onSet(slipped ? undefined : true)}
            className="btn"
            style={slipped ? { background: "#ff3b6b", color: "#fff", boxShadow: "0 0 20px -4px #ff3b6b" } : { background: "#0c0c0c", border: "1px solid #2a2a2a" }}
          >
            {slipped && <X size={16} strokeWidth={3} />} Oldu
          </button>
          <AnimatePresence>{burst > 0 && ok && <Burst key={burst} color={cat.color} radius={40} />}</AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
