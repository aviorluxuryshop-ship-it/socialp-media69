import { marks } from '../Picture';
import type { Dict } from '@/content/tr';

/**
 * Brand mark strip.
 *
 * These marks are published on Socialp Media's own site. The label is
 * deliberately neutral — the strip presents them without asserting a client
 * relationship the agency has not stated itself.
 */
export function Marks({ dict }: { dict: Dict }) {
  const entries = Object.entries(marks);

  return (
    <section className="relative overflow-hidden py-14" aria-label={dict.strip.label}>
      <p className="kicker shell mb-8 text-mist-dim">{dict.strip.label}</p>

      <div className="marquee" style={{ ['--drift' as string]: '52s' }}>
        <div className="marquee-track">
          {[0, 1].map((pass) => (
            <ul key={pass} className="flex shrink-0 items-center" aria-hidden={pass === 1}>
              {entries.map(([id, mark]) => (
                <li key={id} className="px-10 sm:px-14">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/marks/${id}.png`}
                    alt={mark.label}
                    width={mark.width}
                    height={mark.height}
                    loading="lazy"
                    decoding="async"
                    className="h-6 w-auto opacity-45 transition-opacity duration-500 hover:opacity-90 sm:h-7"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}
