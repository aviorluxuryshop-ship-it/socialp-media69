import { Faq } from "@/components/Faq";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileBar } from "@/components/MobileBar";
import { Process } from "@/components/Process";
import { QuoteForm } from "@/components/QuoteForm";
import { ServiceArea } from "@/components/ServiceArea";
import { Services } from "@/components/Services";
import { WhyUs } from "@/components/WhyUs";
import { areas, isPlaceholderContact, site } from "@/data/site";

// Structured data for local search. Phone is only published once it's a real number.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoRepair",
  name: site.name,
  description: site.description,
  url: site.url,
  image: `${site.url}/opengraph-image.png`,
  ...(isPlaceholderContact ? {} : { telephone: site.phone.tel, email: site.email }),
  areaServed: areas.map((name) => ({ "@type": "City", name })),
};

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <Process />
        <WhyUs />
        <ServiceArea />
        <Faq />
        <QuoteForm />
      </main>
      <Footer />
      <MobileBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
