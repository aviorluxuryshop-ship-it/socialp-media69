"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "./Icon";

export type GalleryShot = { image: string; alt: string; product: string; color: string; href: string };
export type GalleryGroup = { id: string; kicker: string; title: string; text: string; shots: GalleryShot[] };

/** Seri seri gruplanmış galeri + klavyeyle kullanılabilen sade lightbox. */
export default function Gallery({ groups }: { groups: GalleryGroup[] }) {
  const all = groups.flatMap((g) => g.shots);
  const offsets = groups.map((_, i) => groups.slice(0, i).reduce((s, g) => s + g.shots.length, 0));
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
    closeBtn.current?.focus();
  };
  const step = useCallback((d: number) => setIndex((i) => (i === null ? i : (i + d + all.length) % all.length)), [all.length]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, step]);

  const shot = index === null ? null : all[index];

  return (
    <>
      <div className="space-y-16 sm:space-y-24">
        {groups.map((g, gi) => (
          <section key={g.id} id={g.id} className="scroll-mt-24" aria-labelledby={`seri-${g.id}`}>
            <div className="container-x grid gap-3 lg:grid-cols-[1fr_1.2fr] lg:items-end lg:gap-14">
              <div>
                <p className="eyebrow">{g.kicker}</p>
                <h2 id={`seri-${g.id}`} className="h-display mt-2 text-[26px] sm:text-4xl">{g.title}</h2>
              </div>
              <p className="max-w-xl text-[15.5px] leading-relaxed text-mute">{g.text}</p>
            </div>
            <div className="container-x">
            <ul
              className={`hide-scrollbar -mx-4 mt-6 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:gap-4 sm:overflow-visible sm:px-0 ${
                g.shots.length >= 5 ? "sm:grid-cols-5" : "sm:grid-cols-4"
              }`}
            >
              {g.shots.map((s, si) => (
                <li key={s.image} className={`shrink-0 snap-start ${g.shots.length === 1 ? "w-[70%] sm:w-auto" : "w-[62%] sm:w-auto"}`}>
                  <button
                    type="button"
                    onClick={() => open(offsets[gi] + si)}
                    aria-label={`${s.product}, ${s.color}: fotoğrafı büyüt`}
                    className="group relative block aspect-[2/3] w-full overflow-hidden rounded-xl bg-sand"
                  >
                    <Image
                      src={s.image}
                      alt={s.alt}
                      fill
                      sizes="(min-width:1280px) 290px, (min-width:640px) 24vw, 62vw"
                      className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </button>
                  <p className="mt-2.5 text-[14px] leading-snug">
                    <Link href={s.href} className="font-medium underline-offset-4 hover:underline">{s.product}</Link>
                    <span className="block text-[13px] text-mute">{s.color}</span>
                  </p>
                </li>
              ))}
            </ul>
            </div>
          </section>
        ))}
      </div>

      <dialog
        ref={dialog}
        aria-label="Fotoğraf görüntüleyici"
        onClose={() => setIndex(null)}
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        className="lightbox on-dark m-0 h-dvh max-h-none w-screen max-w-none bg-ink p-0 text-cream"
      >
        {shot && index !== null && (
          <div className="flex h-full flex-col">
            <div className="flex h-14 shrink-0 items-center justify-between px-4">
              <p className="text-[13.5px] tabular-nums text-cream/70" aria-live="polite">{index + 1} / {all.length}</p>
              <button ref={closeBtn} type="button" onClick={() => dialog.current?.close()} aria-label="Görüntüleyiciyi kapat" className="-mr-2 grid h-11 w-11 place-items-center rounded-full hover:bg-white/10">
                <Icon name="close" size={24} />
              </button>
            </div>
            <div className="relative min-h-0 flex-1">
              <Image key={shot.image} src={shot.image} alt={shot.alt} fill sizes="100vw" className="fade-in object-contain" />
              <button type="button" onClick={() => step(-1)} aria-label="Önceki fotoğraf" className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/60 hover:bg-ink/90 sm:left-5">
                <Icon name="chevron-left" size={24} />
              </button>
              <button type="button" onClick={() => step(1)} aria-label="Sonraki fotoğraf" className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-ink/60 hover:bg-ink/90 sm:right-5">
                <Icon name="chevron-right" size={24} />
              </button>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
              <p className="text-[14.5px]">
                <span className="font-semibold">{shot.product}</span>
                <span className="text-cream/70"> · {shot.color}</span>
              </p>
              <Link href={shot.href} className="btn-light min-h-[44px] px-5 py-2 text-[14px]">
                Ürünü incele <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
