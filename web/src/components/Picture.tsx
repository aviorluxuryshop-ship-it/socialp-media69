import manifest from '@/lib/media-manifest.json';

type Manifest = {
  images: Record<
    string,
    { width: number; height: number; widths: number[]; kind: string; cat: string; blur: string }
  >;
  marks: Record<string, { label: string; width: number; height: number }>;
  logo: { width: number; height: number };
};

const media = manifest as Manifest;

export const images = media.images;
export const marks = media.marks;
export const logoMeta = media.logo;

export type PictureProps = {
  id: string;
  alt: string;
  /** `sizes` attribute — always pass a real value so the browser picks the right rendition. */
  sizes: string;
  className?: string;
  /** Above-the-fold images opt out of lazy loading and get fetch priority. */
  priority?: boolean;
  /** Object position, e.g. `50% 30%`. */
  position?: string;
};

/**
 * Renders a pre-built responsive AVIF/WebP pair.
 *
 * Intrinsic width/height are always emitted so the browser reserves space and the
 * layout never shifts as images arrive. The LQIP sits behind the image as a
 * background so there is no empty hole while it decodes.
 */
export function Picture({ id, alt, sizes, className, priority, position }: PictureProps) {
  const img = media.images[id];
  if (!img) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(`Picture: unknown media id "${id}"`);
    }
    return null;
  }

  const srcset = (ext: 'avif' | 'webp') =>
    img.widths.map((w) => `/media/${id}-${w}.${ext} ${w}w`).join(', ');
  const fallbackWidth = img.widths[img.widths.length - 1];

  return (
    <picture>
      <source type="image/avif" srcSet={srcset('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcset('webp')} sizes={sizes} />
      <img
        src={`/media/${id}-${fallbackWidth}.webp`}
        alt={alt}
        width={img.width}
        height={img.height}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        className={className}
        style={{
          objectPosition: position,
          backgroundImage: `url("${img.blur}")`,
          backgroundSize: 'cover',
          backgroundPosition: position ?? 'center',
        }}
      />
    </picture>
  );
}
