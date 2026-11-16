const steps = ["Sepet", "Bilgiler", "Ödeme", "Onay"];

/** Sepet → Bilgiler → Ödeme → Onay adım göstergesi. */
export default function CheckoutSteps({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="flex items-center gap-2 text-[12.5px] sm:gap-3 sm:text-[13.5px]" aria-label="Sipariş adımları">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "now" : "next";
        return (
          <li key={s} aria-current={state === "now" ? "step" : undefined} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && <span className={`h-px w-4 sm:w-8 ${state === "next" ? "bg-line" : "bg-ink"}`} aria-hidden />}
            <span className={`grid h-6 w-6 place-items-center rounded-full text-[11.5px] font-bold ${state === "next" ? "border border-line text-mute" : "bg-ink text-cream"}`}>{n}</span>
            <span className={state === "now" ? "font-semibold" : "sr-only text-mute sm:not-sr-only"}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
