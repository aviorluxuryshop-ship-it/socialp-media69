import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ButtonLink";
import { FaqList } from "@/components/FaqList";
import { SectionHeading } from "@/components/SectionHeading";
import { allFaqs, homeFaqIds } from "@/data/faq";

export function FaqPreview() {
  const items = homeFaqIds.map((id) => allFaqs.find((f) => f.id === id)!);
  return (
    <section className="bg-white py-24 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="reveal">
          <SectionHeading eyebrow="FAQ" title="Common questions about auto glass">
            <p>Quick answers on repair, replacement, pricing and insurance. More on our full FAQ page.</p>
          </SectionHeading>
          <ButtonLink href="/faq" variant="outline-dark" className="mt-8">
            View all FAQs
            <ArrowRight aria-hidden />
          </ButtonLink>
        </div>
        <div className="reveal">
          <FaqList items={items} />
        </div>
      </div>
    </section>
  );
}
