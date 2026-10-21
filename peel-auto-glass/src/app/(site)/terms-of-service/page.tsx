import { LegalLayout, PolicyContact } from "@/components/LegalLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Terms of Service",
  description:
    "The terms for using the Peel Auto Glass website, and how service details are confirmed directly with the business.",
  path: "/terms-of-service",
});

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      path="/terms-of-service"
      intro="The terms for using this website, and what to expect when you contact Peel Auto Glass about a repair or replacement."
      sections={[
        {
          id: "using-this-website",
          title: "Using this website",
          body: (
            <p>
              By using this website you agree to these terms. If you do not agree, please do not use the website. These
              terms apply to the website itself. Work we carry out for you is arranged with you directly, as described
              below.
            </p>
          ),
        },
        {
          id: "what-this-site-is",
          title: "What this website is",
          body: (
            <p>
              This website provides information about Peel Auto Glass and its services: windshield repair and
              replacement, side window replacement and rear windshield replacement. It does not offer online booking,
              online quotes or online payment. To discuss a job, call or email us.
            </p>
          ),
        },
        {
          id: "general-information",
          title: "Information is general guidance",
          body: (
            <p>
              Descriptions of repair and replacement, the FAQ and other content are general information. They are not an
              assessment of your vehicle. Whether glass can be repaired or must be replaced depends on the damage, and we
              need to assess it. Please confirm anything that matters to you directly with us.
            </p>
          ),
        },
        {
          id: "services-quotes",
          title: "Services, estimates and appointments",
          body: (
            <>
              <p>
                Nothing on this website is an offer, a quote, a guarantee or a promise of availability. We do not publish
                prices, turnaround times or appointment availability on the website. Services are provided on the terms we
                agree with you by phone, by email or in person.
              </p>
              <p>
                Before work begins, please confirm with us the work to be done, the price and what it includes, the timing,
                and any warranty or service terms. See our{" "}
                <a href="/warranty-and-service-policy">Warranty &amp; Service Policy</a>.
              </p>
            </>
          ),
        },
        {
          id: "accurate-information",
          title: "Information you give us",
          body: (
            <p>
              Please give us accurate information about your vehicle and the damage. Glass differs by make, model, year and
              features, and our recommendation and the glass we source depend on what you tell us.
            </p>
          ),
        },
        {
          id: "intellectual-property",
          title: "Content and intellectual property",
          body: (
            <>
              <p>
                The content of this website, including the Peel Auto Glass name, logo, text and design, belongs to Peel Auto
                Glass or its licensors. Photographs from third parties are credited on our{" "}
                <a href="/image-credits">Image credits</a> page and remain subject to their licences.
              </p>
              <p>
                You may view and print pages for your own personal use. Please do not copy, republish or reuse our content
                or logo without our written permission.
              </p>
            </>
          ),
        },
        {
          id: "third-party-links",
          title: "Links to other websites",
          body: (
            <p>
              This website links to other websites, such as Google Maps. We do not control them and are not responsible for
              their content or practices.
            </p>
          ),
        },
        {
          id: "availability-accuracy",
          title: "Availability and accuracy",
          body: (
            <p>
              We try to keep this website accurate and available, but it is provided as is. Information may contain errors
              or become out of date, and the website may occasionally be unavailable.
            </p>
          ),
        },
        {
          id: "liability",
          title: "Limits on liability",
          body: (
            <p>
              To the extent permitted by law, Peel Auto Glass is not liable for loss arising from your use of, or reliance
              on, this website. Nothing in these terms excludes or limits any liability that cannot be excluded or limited
              under applicable law, or any right you have under Ontario consumer protection law or other laws that cannot be
              waived.
            </p>
          ),
        },
        {
          id: "governing-law",
          title: "Governing law",
          body: (
            <p>
              These terms are governed by the laws of Ontario and the federal laws of Canada that apply there, subject to any
              mandatory rights you have where you live.
            </p>
          ),
        },
        {
          id: "changes",
          title: "Changes to these terms",
          body: <p>We may update these terms from time to time. The &ldquo;Last updated&rdquo; date at the top of the page shows when they last changed. Continued use of the website means you accept the updated terms.</p>,
        },
        {
          id: "contact",
          title: "Contact us",
          body: (
            <>
              <p>Questions about these terms:</p>
              <PolicyContact />
            </>
          ),
        },
      ]}
    />
  );
}
