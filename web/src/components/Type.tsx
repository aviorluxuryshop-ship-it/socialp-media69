import { Fragment, type ReactNode } from 'react';

/**
 * Headline whose lines wipe up from a mask.
 *
 * Lines are authored explicitly rather than measured at runtime, so the server
 * HTML already contains the final structure — no flash, no layout shift, and
 * the text is fully present for crawlers and screen readers.
 */
export function Lines({
  lines,
  className = '',
  as: Tag = 'h2',
  id,
}: {
  lines: ReactNode[];
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  id?: string;
}) {
  return (
    <Tag id={id} className={className} data-lines="">
      {lines.map((line, i) => (
        <span className="line-mask" key={i}>
          <span>{line}</span>
        </span>
      ))}
    </Tag>
  );
}

/**
 * Statement type that reveals word by word. Splitting happens at render time so
 * the accessible text stays intact; each word keeps its trailing space.
 */
export function Words({
  text,
  className = '',
  as: Tag = 'h2',
  id,
}: {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div';
  id?: string;
}) {
  const words = text.split(' ');
  return (
    <Tag id={id} className={className} data-words="">
      {words.map((word, i) => (
        // The separating space stays outside the clipping span, otherwise it
        // collapses against the inline-block edge and words run together.
        <Fragment key={i}>
          <span>
            <span>{word}</span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </Fragment>
      ))}
    </Tag>
  );
}
