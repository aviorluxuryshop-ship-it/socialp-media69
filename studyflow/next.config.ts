import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  agentRules: false,
  // pdfjs sunucuda yalnızca kaynak sayfası getirmede kullanılır; paketlenmeden Node'dan yüklenir.
  serverExternalPackages: ["pdfjs-dist"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // PDF sayfa metni çıkarımı için pdfjs dosyalarını sunucu işlevlerine dahil et
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/pdfjs-dist/legacy/build/**", "./node_modules/pdfjs-dist/standard_fonts/**", "./node_modules/pdfjs-dist/cmaps/**"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "tymm.meb.gov.tr", pathname: "/assets/img/**" }],
  },
};

export default nextConfig;
