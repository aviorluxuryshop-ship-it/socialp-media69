import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { SiteChrome } from "@/components/SiteChrome";
import { business } from "@/data/business";

export const metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <SiteChrome>
      <section className="on-dark bg-ink text-white">
        <div className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
          <p className="font-display text-sm font-bold uppercase tracking-[0.18em] text-brand-soft">Error 404</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">We couldn&rsquo;t find that page</h1>
          <p className="mt-5 max-w-xl text-lg text-white/75">
            The page may have moved or the address may be mistyped. Head back to the homepage, or call us if you need
            help with your vehicle&rsquo;s glass.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/">Back to the homepage</ButtonLink>
            <ButtonLink href={business.phone.href} variant="outline-light">
              <Phone aria-hidden />
              Call {business.phone.short}
            </ButtonLink>
          </div>
        </div>
      </section>
    </SiteChrome>
  );
}
