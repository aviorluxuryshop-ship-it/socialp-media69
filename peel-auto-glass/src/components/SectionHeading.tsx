export function SectionHeading({
  eyebrow,
  title,
  text,
  tone = "light",
}: {
  eyebrow: string;
  title: string;
  text?: string;
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-red">{eyebrow}</p>
      <h2
        className={`mt-3 text-balance text-3xl font-extrabold tracking-tight sm:text-4xl ${dark ? "text-white" : "text-navy-900"}`}
      >
        {title}
      </h2>
      {text && <p className={`mt-4 text-lg leading-relaxed ${dark ? "text-white/70" : "text-navy-900/70"}`}>{text}</p>}
    </div>
  );
}
