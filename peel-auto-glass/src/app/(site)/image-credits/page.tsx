import { PageHero } from "@/components/PageHero";
import { credits, suppliedAssets } from "@/data/credits";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Image Credits",
  description: "Sources and licences for the photography used on the Peel Auto Glass website.",
  path: "/image-credits",
  noindex: true,
});

export default function ImageCreditsPage() {
  return (
    <>
      <PageHero eyebrow="Credits" title="Image credits" crumbs={[{ label: "Image credits", href: "/image-credits" }]}>
        <p>Sources and licences for the photography on this website.</p>
      </PageHero>
      <div className="legal mx-auto max-w-3xl px-5 py-16 sm:py-20">
        <h2 className="!mt-0">Supplied by Peel Auto Glass</h2>
        <ul>
          {suppliedAssets.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>

        <h2>Stock photography</h2>
        <p>
          The following photographs are used under the Pexels Licence, which permits free use without attribution. We
          credit the photographers anyway. Several are cropped.
        </p>
        <ul>
          {credits.map((c) => (
            <li key={c.file}>
              <strong>{c.usedFor}:</strong> &ldquo;{c.title}&rdquo; by {c.author} on{" "}
              <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer">
                Pexels<span className="sr-only"> (opens in a new tab)</span>
              </a>
              . {c.licence}.
            </li>
          ))}
        </ul>

        <h2>Fonts and icons</h2>
        <ul>
          <li>Inter and Archivo typefaces, licensed under the SIL Open Font Licence 1.1 and hosted on this site.</li>
          <li>Interface icons from Lucide, licensed under the ISC licence.</li>
        </ul>
      </div>
    </>
  );
}
