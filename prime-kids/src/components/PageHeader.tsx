/** İç sayfaların ortak başlık alanı. */
export default function PageHeader({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: React.ReactNode }) {
  return (
    <header className="container-x pb-8 pt-9 sm:pb-10 sm:pt-14">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="h-display mt-2.5 max-w-3xl text-[32px] sm:text-5xl">{title}</h1>
      {lead && <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-mute sm:text-[17px]">{lead}</p>}
    </header>
  );
}
