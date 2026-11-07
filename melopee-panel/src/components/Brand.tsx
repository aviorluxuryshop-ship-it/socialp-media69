import clsx from "clsx";

/** Melopée kelime markası: serif logotip + aralıklı alt başlık. */
export function Brand({ size = "md", sub = "Nail Studio", className }: { size?: "sm" | "md" | "lg"; sub?: string; className?: string }) {
  return (
    <div className={clsx("flex select-none flex-col leading-none", className)}>
      <span
        className={clsx(
          "display text-ink",
          size === "sm" && "text-[22px]",
          size === "md" && "text-[28px]",
          size === "lg" && "text-[44px]",
        )}
      >
        Melopée
      </span>
      {sub && (
        <span
          lang="en"
          className={clsx(
            "mt-1 font-semibold uppercase text-gold",
            size === "lg" ? "text-[11px] tracking-[0.42em]" : "text-[9.5px] tracking-[0.36em]",
          )}
        >
          {sub}
        </span>
      )}
    </div>
  );
}
