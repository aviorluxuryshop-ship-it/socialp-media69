import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Tamamen statik çıktı: Vercel, Netlify, GitHub Pages veya herhangi bir statik sunucuda çalışır.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default nextConfig;
