import { business, siteUrl } from "@/data/business";
import { services } from "@/data/services";

/**
 * Local business structured data built only from verified details: name, phone,
 * email, address and the services listed on the site. Deliberately omitted until the
 * business confirms them: opening hours, ratings, price range, geo coordinates,
 * credentials and a service radius.
 */
export function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: business.name,
    description:
      "Windshield repair and replacement, side window replacement and rear windshield replacement in Mississauga, Ontario.",
    ...(siteUrl ? { url: siteUrl, image: `${siteUrl}/opengraph-image.jpg` } : {}),
    telephone: business.phone.e164,
    email: business.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.regionCode,
      addressCountry: business.address.countryCode,
    },
    areaServed: { "@type": "City", name: business.address.city },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Auto glass services",
      itemListElement: services.map((s) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: s.title },
      })),
    },
  };

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so the JSON can never close the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
