import { LegalLayout, PolicyContact } from "@/components/LegalLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Privacy Policy",
  description:
    "How Peel Auto Glass handles personal information when you visit this website or contact us by phone or email.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      path="/privacy-policy"
      intro="How we handle personal information when you visit this website or contact Peel Auto Glass by phone or email."
      sections={[
        {
          id: "who-we-are",
          title: "Who we are",
          body: (
            <>
              <p>
                Peel Auto Glass (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an auto glass business located at 3443 Wolfedale
                Rd #4, Mississauga, Ontario. This policy explains how we handle personal information about people who
                visit this website or contact us. &ldquo;Personal information&rdquo; means information about an
                identifiable individual.
              </p>
              <p>
                As a private business operating in Ontario, we aim to handle personal information in line with Canada&rsquo;s
                federal private-sector privacy law, the <em>Personal Information Protection and Electronic Documents Act</em>{" "}
                (PIPEDA), and any other privacy law that applies to us.
              </p>
            </>
          ),
        },
        {
          id: "this-website",
          title: "What this website collects",
          body: (
            <>
              <p>
                This website is informational. It has no contact forms, user accounts, online booking or online
                payment, so it does not ask you to enter personal information. To reach us you call or email us
                directly.
              </p>
              <p>
                We do not use analytics, advertising or tracking tools on this website, and the website does not set
                cookies. See our <a href="/cookie-policy">Cookie Policy</a>.
              </p>
              <p>
                Like most websites, the servers that deliver this site automatically process technical information about
                each request, such as your IP address, the date and time, the pages requested, and your browser and
                device type. Our website hosting provider, currently Vercel Inc., does this so the site can be delivered,
                kept secure and fixed when something goes wrong. We do not use this information to identify you.
              </p>
            </>
          ),
        },
        {
          id: "what-you-give-us",
          title: "Information you give us when you call or email",
          body: (
            <>
              <p>When you contact us, you may give us or we may receive:</p>
              <ul>
                <li>your name, phone number (including through caller identification) and email address;</li>
                <li>your vehicle details, such as year, make, model and possibly its vehicle identification number (VIN);</li>
                <li>a description of the damage, any photos or other attachments you send, and where your vehicle is;</li>
                <li>details about appointments, estimates and any work we carry out; and</li>
                <li>anything else you choose to tell us.</li>
              </ul>
              <p>
                Please do not send payment card details or government identification numbers by email.
              </p>
            </>
          ),
        },
        {
          id: "how-we-use",
          title: "How we use personal information",
          body: (
            <>
              <p>We use personal information to:</p>
              <ul>
                <li>respond to your enquiries and calls;</li>
                <li>assess the damage and recommend repair or replacement;</li>
                <li>identify the right glass for your vehicle;</li>
                <li>arrange and carry out the work you agree to, and communicate with you about it;</li>
                <li>keep records for business, accounting, tax, legal and insurance purposes; and</li>
                <li>protect our business, our website and our customers from misuse or fraud.</li>
              </ul>
              <p>
                We will not add you to a marketing list without your consent. Canada&rsquo;s anti-spam legislation
                (CASL) requires consent for commercial electronic messages, and we respect that requirement.
              </p>
            </>
          ),
        },
        {
          id: "consent",
          title: "Consent",
          body: (
            <p>
              We collect, use and disclose personal information with your consent, which may be express or implied from
              the circumstances (for example, when you call us to ask about a repair), or as otherwise permitted or
              required by law. You can withdraw your consent at any time, subject to legal or contractual restrictions
              and reasonable notice. Withdrawing consent may limit our ability to help you.
            </p>
          ),
        },
        {
          id: "sharing",
          title: "Who we share information with",
          body: (
            <>
              <p>We share personal information only as needed for the purposes above. This may include:</p>
              <ul>
                <li>
                  service providers that help us operate, such as our email provider (Yahoo Mail) and our website hosting
                  provider;
                </li>
                <li>people you ask us to deal with on your behalf, such as an insurer or broker;</li>
                <li>professional advisers, such as accountants, lawyers and insurers;</li>
                <li>government authorities or other parties when the law requires or permits it; and</li>
                <li>a buyer or successor, if our business is ever sold or reorganised, who must protect the information.</li>
              </ul>
              <p>
                Some of these providers are based outside Canada, including in the United States. Information they handle
                may be stored or processed in other countries and may be accessible to courts and authorities there under
                their laws.
              </p>
            </>
          ),
        },
        {
          id: "retention-security",
          title: "Storage, security and retention",
          body: (
            <>
              <p>
                We keep personal information only as long as we need it for the purposes described above and to meet legal,
                tax, accounting and insurance requirements. After that we delete or de-identify it.
              </p>
              <p>
                We use safeguards that are reasonable for the sensitivity of the information. No method of transmission
                over the internet or of electronic storage is completely secure, so we cannot guarantee absolute security.
              </p>
            </>
          ),
        },
        {
          id: "links",
          title: "Links to other websites",
          body: (
            <p>
              This website links to third-party websites, for example Google Maps for directions and Pexels for image
              credits. When you follow a link you leave our website, and the other site&rsquo;s own privacy practices
              apply. We are not responsible for them.
            </p>
          ),
        },
        {
          id: "your-rights",
          title: "Your choices and rights",
          body: (
            <>
              <p>Under Canadian privacy law you can generally:</p>
              <ul>
                <li>ask whether we hold personal information about you, and ask for access to it;</li>
                <li>challenge the accuracy of the information and ask us to correct it;</li>
                <li>withdraw your consent, as described above; and</li>
                <li>ask questions or raise concerns about how we handle personal information.</li>
              </ul>
              <p>
                Contact us using the details below. We may need to confirm your identity before sharing information. If
                you are not satisfied with our response, you can contact the{" "}
                <a href="https://www.priv.gc.ca/" target="_blank" rel="noopener noreferrer">
                  Office of the Privacy Commissioner of Canada<span className="sr-only"> (opens in a new tab)</span>
                </a>
                .
              </p>
            </>
          ),
        },
        {
          id: "children",
          title: "Children",
          body: <p>This website is not directed at children, and we do not knowingly collect personal information from them through it.</p>,
        },
        {
          id: "changes",
          title: "Changes to this policy",
          body: <p>We may update this policy from time to time. The &ldquo;Last updated&rdquo; date at the top of the page shows when it last changed.</p>,
        },
        {
          id: "contact",
          title: "Contact us about privacy",
          body: (
            <>
              <p>For privacy questions or requests, contact:</p>
              <PolicyContact />
            </>
          ),
        },
      ]}
    />
  );
}
