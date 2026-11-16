/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { formats: ["image/avif", "image/webp"] },
  poweredByHeader: false,
  // Eski adresler kırılmasın: teslimat/iade bilgileri yasal sayfalara taşındı.
  async redirects() {
    return [
      { source: "/teslimat-iade", destination: "/yasal/teslimat-kargo", permanent: true },
      { source: "/iade", destination: "/yasal/iade-degisim", permanent: true },
      { source: "/kvkk", destination: "/yasal/kvkk-aydinlatma-metni", permanent: true },
    ];
  },
};

export default nextConfig;
