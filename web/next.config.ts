import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Fully static site: deployable to any host (Vercel, Netlify, Nginx, shared hosting).
  output: 'export',
  trailingSlash: true,
  images: {
    // Renditions are pre-generated at build time by scripts/build-media.mjs,
    // so the on-demand optimiser is not needed.
    unoptimized: true,
  },
};

export default nextConfig;
