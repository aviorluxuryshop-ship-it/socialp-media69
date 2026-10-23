"use client";

import type { ReactNode } from "react";
import { Markdown } from "./Markdown";
import type { SummaryContent } from "@/lib/types";

function Section({ title, count, children, open = false }: { title: string; count?: number; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group card overflow-hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="font-display text-[1.12rem] text-ink">{title}</span>
        <span className="flex items-center gap-3 text-sm text-ink-3">
          {count !== undefined && <span>{count}</span>}
          <span className="transition-transform group-open:rotate-180" aria-hidden>
            ⌄
          </span>
        </span>
      </summary>
      <div className="border-t border-line px-5 py-5">{children}</div>
    </details>
  );
}

/** Özet çıktıları: varsayılan olarak kısa özet açık, diğerleri istenince genişler. */
export function SummaryView({ content }: { content: SummaryContent }) {
  return (
    <div className="space-y-3">
      {content.quick && content.quick.length > 0 && (
        <Section title="Hızlı tekrar özeti" count={content.quick.length} open>
          <ul className="space-y-2.5">
            {content.quick.map((q, i) => (
              <li key={i} className="flex gap-3 text-[1rem] leading-relaxed text-ink">
                <span className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                <span className="min-w-0">
                  <Markdown>{q}</Markdown>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {content.keyConcepts && content.keyConcepts.length > 0 && (
        <Section title="Anahtar kavramlar" count={content.keyConcepts.length} open={!content.quick?.length}>
          <dl className="grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {content.keyConcepts.map((k, i) => (
              <div key={i}>
                <dt className="font-semibold text-ink">{k.term}</dt>
                <dd className="text-[0.95rem] leading-relaxed text-ink-2">
                  <Markdown>{k.meaning}</Markdown>
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      )}
      {content.detailed && (
        <Section title="Ayrıntılı özet">
          <Markdown>{content.detailed}</Markdown>
        </Section>
      )}
      {content.formulas && content.formulas.length > 0 && (
        <Section title="Formül kâğıdı" count={content.formulas.length}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {content.formulas.map((f, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface-2/50 px-4 py-3.5">
                <p className="text-sm font-semibold text-ink">{f.name}</p>
                <div className="my-1.5 overflow-x-auto">
                  <Markdown>{`$$${f.latex.replace(/^\$+|\$+$/g, "")}$$`}</Markdown>
                </div>
                <p className="text-[0.88rem] leading-snug text-ink-3">{f.note}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {content.comparisons && content.comparisons.length > 0 && (
        <Section title="Kavram karşılaştırması" count={content.comparisons.length}>
          <div className="space-y-6">
            {content.comparisons.map((c, i) => (
              <div key={i}>
                <p className="mb-2 font-semibold text-ink">{c.title}</p>
                <div className="overflow-x-auto rounded-xl border border-line">
                  <table className="w-full min-w-[420px] border-collapse text-[0.92rem]">
                    <thead>
                      <tr className="bg-surface-2 text-left">
                        <th className="px-3 py-2.5 font-semibold text-ink-3">Ölçüt</th>
                        {c.columns.map((col, k) => (
                          <th key={k} className="px-3 py-2.5 font-semibold text-ink">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map((r, k) => (
                        <tr key={k} className="border-t border-line align-top">
                          <td className="px-3 py-2.5 font-medium text-ink-2">{r.label}</td>
                          {c.columns.map((_, j) => (
                            <td key={j} className="px-3 py-2.5 text-ink-2">
                              {r.cells[j] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
      {content.examSheet && content.examSheet.length > 0 && (
        <Section title="Sınav odaklı tekrar kâğıdı" count={content.examSheet.length}>
          <ol className="space-y-3.5">
            {content.examSheet.map((e, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent-soft text-[12px] font-bold text-accent">{i + 1}</span>
                <div className="min-w-0">
                  <p className="text-[1rem] font-medium leading-snug text-ink">{e.point}</p>
                  {e.tip && <p className="mt-0.5 text-[0.92rem] leading-relaxed text-ink-3">{e.tip}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}
      {content.flashcards && content.flashcards.length > 0 && (
        <Section title="Bilgi kartları" count={content.flashcards.length}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {content.flashcards.map((f, i) => (
              <li key={i} className="rounded-2xl border border-line bg-surface-2/50 px-4 py-3.5">
                <p className="font-medium text-ink">{f.front}</p>
                <p className="mt-1.5 border-t border-line pt-1.5 text-[0.93rem] text-ink-2">{f.back}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
