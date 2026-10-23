"use client";

import clsx from "clsx";
import { memo } from "react";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import type { SourceRef } from "@/lib/types";

/** Güvenli işleme: ham HTML kapalı, matematik KaTeX ile; [K1] atıfları tıklanabilir rozete dönüşür. */
export const Markdown = memo(function Markdown({
  children,
  className,
  cites,
}: {
  children: string;
  className?: string;
  cites?: Record<string, SourceRef>;
}) {
  const text = withCites(normalizeMath(children), cites);
  return (
    <div className={clsx("prose-flow", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: "ignore", output: "html" }]]}
        urlTransform={(u) => (u.startsWith("cite:") ? u : defaultUrlTransform(u))}
        components={{
          a: ({ href, children: c }) => {
            if (href?.startsWith("cite:")) {
              const id = href.slice(5);
              const ref = cites?.[id];
              const chip = (
                <span className="mx-0.5 inline-flex h-[1.35em] min-w-[1.35em] items-center justify-center rounded-md bg-accent-soft px-1 align-baseline text-[0.72em] font-semibold text-accent no-underline">
                  {id}
                </span>
              );
              return ref?.url ? (
                <a href={ref.url} target="_blank" rel="noopener noreferrer" title={ref.label} className="no-underline">
                  {chip}
                </a>
              ) : (
                <span title={ref?.label}>{chip}</span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {c}
              </a>
            );
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
});

/** \( \) ve \[ \] gösterimlerini remark-math'in anladığı $ ve $$ biçimine çevirir. */
export function normalizeMath(s: string): string {
  return s.replace(/\\\[([\s\S]+?)\\\]/g, (_m, g) => `\n$$\n${g}\n$$\n`).replace(/\\\(([\s\S]+?)\\\)/g, (_m, g) => `$${g}$`);
}

function withCites(s: string, cites?: Record<string, SourceRef>): string {
  if (!cites) return s;
  return s.replace(/\[((?:K|M)\d+)\](?!\()/g, (m, id) => (cites[id] ? `[${id}](cite:${id})` : m));
}
