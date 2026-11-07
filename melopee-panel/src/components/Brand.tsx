import clsx from "clsx";

/** Melopee logosu: web sitesindeki işaret + Marcellus ile MELOPEE yazısı ve alt başlık. */
export function Brand({ size = "md", sub = "Nail Art Studio", className }: { size?: "sm" | "md" | "lg"; sub?: string; className?: string }) {
  const mark = size === "lg" ? 52 : size === "md" ? 38 : 30;
  return (
    <div className={clsx("flex select-none items-center", size === "lg" ? "gap-3.5" : "gap-2.5", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/mark-ink.png" alt="" width={mark} height={Math.round((mark * 484) / 520)} className="shrink-0" />
      <div className="flex flex-col leading-none">
        <span
          lang="en"
          className={clsx(
            "font-[family-name:var(--font-mark)] uppercase text-ink",
            size === "sm" && "text-[18px] tracking-[0.2em]",
            size === "md" && "text-[22px] tracking-[0.22em]",
            size === "lg" && "text-[32px] tracking-[0.24em]",
          )}
        >
          Melopee
        </span>
        {sub && (
          <span lang="en" className={clsx("mt-1.5 font-semibold text-rose", size === "lg" ? "text-[13px] tracking-[0.08em]" : "text-[11px] tracking-[0.06em]")}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
