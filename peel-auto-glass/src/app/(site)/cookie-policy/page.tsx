import { LegalLayout, PolicyContact } from "@/components/LegalLayout";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Cookie Policy",
  description: "This website does not set cookies and does not use analytics, advertising or tracking technologies.",
  path: "/cookie-policy",
});

export default function CookiePolicyPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      intro="What cookies and similar technologies this website uses. Short answer: none."
      sections={[
        {
          id: "what-are-cookies",
          title: "What cookies are",
          body: (
            <p>
              Cookies are small text files that a website can store in your browser. Similar technologies, such as local
              storage, pixels and device fingerprinting, can also be used to remember or track visitors.
            </p>
          ),
        },
        {
          id: "our-use",
          title: "What this website uses",
          body: (
            <>
              <p>
                This website does not set cookies. It does not use analytics, advertising, social media or other tracking
                technologies, and it does not store information in your browser&rsquo;s local or session storage.
              </p>
              <p>
                Because we do not use cookies or tracking technologies, this website does not show a cookie consent banner.
              </p>
            </>
          ),
        },
        {
          id: "fonts-media",
          title: "Fonts, images and embedded content",
          body: (
            <p>
              The fonts and images on this website are hosted with the website itself. We do not load fonts, scripts or
              embedded content from third parties, so no third party receives your visit as a result of those.
            </p>
          ),
        },
        {
          id: "server-logs",
          title: "Server logs",
          body: (
            <p>
              Our website hosting provider processes basic technical information about requests, such as IP address and pages
              requested, to deliver and secure the website. This is not done with cookies. See our{" "}
              <a href="/privacy-policy">Privacy Policy</a>.
            </p>
          ),
        },
        {
          id: "external-links",
          title: "Links to other websites",
          body: (
            <p>
              Some links, such as the directions link to Google Maps, take you to other websites. Those websites may use
              cookies, and their own policies apply once you leave this website.
            </p>
          ),
        },
        {
          id: "controls",
          title: "Your browser controls",
          body: (
            <p>
              You can view, block and delete cookies in your browser settings. Because this website does not set cookies,
              you do not need to change anything to browse it.
            </p>
          ),
        },
        {
          id: "changes",
          title: "If this changes",
          body: (
            <p>
              If we add analytics or any other non-essential cookies or tracking technology, we will update this policy
              first and ask for your consent before they are used, where the law requires it.
            </p>
          ),
        },
        {
          id: "contact",
          title: "Contact us",
          body: (
            <>
              <p>Questions about this policy:</p>
              <PolicyContact />
            </>
          ),
        },
      ]}
    />
  );
}
