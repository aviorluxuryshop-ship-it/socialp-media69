import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import contact from "@/assets/images/contact-mirror.jpg";
import crack from "@/assets/images/repair-crack.jpg";
import glass from "@/assets/images/glass-sky.jpg";
import installers from "@/assets/images/about-installers.jpg";
import rear from "@/assets/images/service-rear-window.jpg";
import windshield from "@/assets/images/service-windshield.jpg";
import { SectionHeading } from "@/components/SectionHeading";

/**
 * The homepage points to each page and says nothing more: the detail lives on
 * the page itself, one topic per page.
 */
const tiles: { href: string; title: string; text: string; image: StaticImageData }[] = [
  { href: "/services", title: "Services", text: "Windshield, side and rear glass", image: windshield },
  { href: "/how-it-works", title: "How It Works", text: "From first call to finished glass", image: installers },
  { href: "/auto-glass-guide", title: "Auto Glass Guide", text: "Repair or replace?", image: crack },
  { href: "/about", title: "About Us", text: "How we work", image: glass },
  { href: "/faq", title: "FAQ", text: "Straight answers", image: rear },
  { href: "/contact", title: "Contact Us", text: "Call or email us", image: contact },
];

export function PageTiles() {
  return (
    <section id="explore" className="scroll-mt-16 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5">
        <div className="reveal">
          <SectionHeading eyebrow="Explore" title="Where would you like to start?" />
        </div>
        <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((t, i) => (
            <li key={t.href} className="reveal">
              <article className="group zoom on-dark relative aspect-[5/4] overflow-hidden bg-ink text-white sm:aspect-[4/3] lg:aspect-[5/4]">
                <Image
                  src={t.image}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 31vw, (min-width: 640px) 47vw, 100vw"
                  placeholder="blur"
                  className="object-cover"
                />
                <div
                  aria-hidden
                  className="absolute inset-0 bg-[linear-gradient(0deg,rgb(10_19_38/0.92)_8%,rgb(10_19_38/0.25)_62%,rgb(10_19_38/0.1)_100%)]"
                />
                <span
                  aria-hidden
                  className="absolute left-5 top-5 font-display text-sm font-bold tabular-nums tracking-[0.16em] text-white/80"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  aria-hidden
                  className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-white/40 transition-colors group-hover:border-white group-hover:bg-white group-hover:text-ink"
                >
                  <ArrowUpRight className="size-4" />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="text-2xl font-bold leading-tight sm:text-[1.65rem]">
                    <Link href={t.href} className="stretch">
                      {t.title}
                    </Link>
                  </h3>
                  <p className="mt-1.5 text-[0.95rem] text-white/80">{t.text}</p>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
