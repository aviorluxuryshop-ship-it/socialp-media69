/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // A catalogue with no server-side state: every page is prerendered and the
  // whole site ships as static files.
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  agentRules: false,
}

export default nextConfig
