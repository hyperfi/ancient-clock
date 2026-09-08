import type { NextConfig } from "next";

const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
// For GitHub Pages, the base path is usually the repo name (/ancient-clock)
// unless overridden by NEXT_PUBLIC_BASE_PATH (e.g. empty string for custom domain or user site)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isGithubActions ? '/ancient-clock' : '');

const nextConfig: NextConfig = {
  output: 'export',
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  allowedDevOrigins: [
    '*.trycloudflare.com',
    'trycloudflare.com',
    'localhost:3000',
  ],
};

export default nextConfig;
