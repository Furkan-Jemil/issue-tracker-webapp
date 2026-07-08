import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../../");

// Single source of truth: when API_PROXY_TARGET is set (e.g. the deployed NestJS
// service at https://<nest-host>), all `/api/*` requests from the web app are
// rewritten to that backend — so web and mobile share one unified API.
// When it is UNSET, no rewrite is registered and the web app falls back to its
// own App Router `/api/*` routes. This makes cutover and rollback a single env
// toggle with zero code changes. The trailing slash is trimmed to avoid `//api`.
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, "");

const nextConfig: NextConfig = {
  // Only set tracing root when running inside the monorepo (local dev / CI).
  // On Vercel with rootDirectory=apps/web, __dirname resolves correctly already.
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [],
  },
  devIndicators: false,
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
