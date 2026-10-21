import { Mail, Phone } from "lucide-react";
import { business } from "@/data/business";
import { ButtonLink } from "./ButtonLink";

/** Closing call to action used at the foot of every content page. */
export function CtaBand({
  title = "Have damaged glass on your vehicle?",
  text = "Call or email us with your vehicle details and a description of the damage. We will explain your options.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <section className="on-dark relative isolate overflow-hidden bg-navy text-white">
      <div aria-hidden className="cols" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-5 py-20 sm:py-24 lg:flex-row lg:items-center lg:justify-between">
        <div className="reveal max-w-2xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-soft">
            <span aria-hidden className="flex h-0.5 w-9">
              <span className="w-2/3 bg-brand" />
              <span className="w-1/3 bg-signal" />
            </span>
            Get in touch
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-[1.08] sm:text-4xl lg:text-[2.75rem]">{title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-white/75">{text}</p>
        </div>
        <div className="reveal flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          <ButtonLink href={business.phone.href}>
            <Phone aria-hidden />
            Call {business.phone.short}
          </ButtonLink>
          <ButtonLink href={business.emailHref} variant="outline-light">
            <Mail aria-hidden />
            Email Us
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
