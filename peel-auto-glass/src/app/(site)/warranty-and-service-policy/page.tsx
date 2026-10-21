import { LegalLayout, PolicyContact } from "@/components/LegalLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Warranty & Service Policy",
  description:
    "Warranty and service terms for Peel Auto Glass work are confirmed directly with the business. What to ask before work begins.",
  path: "/warranty-and-service-policy",
});

export default function WarrantyPolicyPage() {
  return (
    <LegalLayout
      title="Warranty & Service Policy"
      intro="Warranty and service terms are confirmed directly with Peel Auto Glass before work begins. Here is what to ask."
      sections={[
        {
          id: "our-approach",
          title: "How we handle warranty and service terms",
          body: (
            <>
              <p>
                We do not publish warranty durations, coverage, exclusions, guarantees or refund terms on this website. They
                depend on the work and your vehicle, and we would rather confirm them with you directly than promise
                something here that does not match your job.
              </p>
              <p>
                Any warranty, guarantee or service terms that apply to your repair or replacement are the ones Peel Auto
                Glass confirms to you directly. Please ask for them in writing, for example on your work order or invoice.
              </p>
            </>
          ),
        },
        {
          id: "what-to-ask",
          title: "What to ask before work begins",
          body: (
            <>
              <p>When you contact us, it is reasonable to ask:</p>
              <ul>
                <li>whether repair or replacement is recommended, and why;</li>
                <li>which glass will be used for your vehicle;</li>
                <li>the total price and what it includes;</li>
                <li>when the work can be done and how long it is expected to take;</li>
                <li>for a windshield replacement, how long the adhesive needs before the vehicle is driven;</li>
                <li>what warranty or guarantee applies, for how long, and what it does not cover; and</li>
                <li>who to contact, and how, if there is a problem after the work.</li>
              </ul>
            </>
          ),
        },
        {
          id: "after-the-work",
          title: "After the work",
          body: (
            <p>
              If you notice a problem after a repair or replacement, such as a leak, a noise or an issue with the glass,
              contact us promptly by phone or email with a description and photos if you can, so that we can discuss it with
              you.
            </p>
          ),
        },
        {
          id: "insurance",
          title: "Insurance claims",
          body: (
            <p>
              Whether your insurance covers glass work depends on your policy and your insurer. Insurance coverage is separate
              from any workmanship or service terms. Check with your insurer or broker, and ask us how payment and any
              paperwork would work for your situation.
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your legal rights",
          body: (
            <p>
              Nothing on this website limits your rights under Ontario consumer protection law or any other law that applies
              to you. Those rights may apply whether or not a separate warranty is offered.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact us",
          body: (
            <>
              <p>To confirm warranty and service terms for your job:</p>
              <PolicyContact />
            </>
          ),
        },
      ]}
    />
  );
}
