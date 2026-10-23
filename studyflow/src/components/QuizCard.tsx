"use client";

import clsx from "clsx";
import { Check, X } from "lucide-react";
import { Markdown } from "./Markdown";

export interface QuizItem {
  stem: string;
  choices: string[];
  answerIndex: number;
  explanation: string;
}

/** Kısa kontrol testi: anında geri bildirim, utandıran dil yok. */
export function QuizCard({ items, picked, onPick, title = "Kısa kontrol" }: { items: QuizItem[]; picked: (number | null)[]; onPick: (qi: number, ci: number) => void; title?: string }) {
  const done = picked.every((p) => p !== null);
  const correct = picked.filter((p, i) => p === items[i].answerIndex).length;
  return (
    <div className="card space-y-5 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg text-ink">{title}</h3>
        {done && (
          <span className="text-sm text-ink-2">
            {items.length} sorudan {correct}&apos;i doğru
          </span>
        )}
      </div>
      {items.map((q, qi) => {
        const p = picked[qi];
        return (
          <div key={qi} className="space-y-2.5">
            <div className="text-[0.97rem] font-medium leading-snug text-ink">
              <Markdown>{`${qi + 1}. ${q.stem}`}</Markdown>
            </div>
            <div className="grid gap-2" role="radiogroup" aria-label={`Soru ${qi + 1}`}>
              {q.choices.map((c, ci) => {
                const chosen = p === ci;
                const isAns = ci === q.answerIndex;
                const reveal = p !== null;
                return (
                  <button
                    key={ci}
                    role="radio"
                    aria-checked={chosen}
                    disabled={reveal}
                    onClick={() => onPick(qi, ci)}
                    className={clsx(
                      "flex items-start gap-3 rounded-xl border px-3.5 py-2.5 text-left text-[0.93rem] leading-snug transition-colors",
                      !reveal && "border-line-strong hover:bg-surface-2",
                      reveal && isAns && "border-ok/50 bg-ok-soft",
                      reveal && chosen && !isAns && "border-warn/50 bg-warn-soft",
                      reveal && !chosen && !isAns && "border-line opacity-70",
                    )}
                  >
                    <span className="mt-px w-5 shrink-0 text-sm font-semibold text-ink-3">{String.fromCharCode(65 + ci)}</span>
                    <span className="min-w-0 flex-1">
                      <Markdown>{c}</Markdown>
                    </span>
                    {reveal && isAns && <Check size={17} className="mt-0.5 shrink-0 text-ok" />}
                    {reveal && chosen && !isAns && <X size={17} className="mt-0.5 shrink-0 text-warn" />}
                  </button>
                );
              })}
            </div>
            {p !== null && (
              <div className="anim-rise rounded-xl bg-surface-2 px-3.5 py-3 text-[0.92rem] text-ink-2">
                <Markdown>{q.explanation}</Markdown>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
