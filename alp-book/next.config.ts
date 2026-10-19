import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Eski "Matris" sayfası Takip tablosu ile birleşti.
  async redirects() {
    return [{ source: "/matrix", destination: "/takip", permanent: true }];
  },
};

export default nextConfig;
