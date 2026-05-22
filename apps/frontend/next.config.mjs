/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: ['@sesur/shared'],
  eslint: {
    // ESLint râle sur les apostrophes françaises. On lint en dev mais pas au build prod.
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: true,
    outputFileTracingRoot: new URL('../../', import.meta.url).pathname,
  },
};

export default nextConfig;
