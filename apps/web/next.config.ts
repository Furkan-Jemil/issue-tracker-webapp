import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.join(__dirname, "../../");

const nextConfig: NextConfig = {
  // Only set tracing root when running inside the monorepo (local dev / CI).
  // On Vercel with rootDirectory=apps/web, __dirname resolves correctly already.
  outputFileTracingRoot: monorepoRoot,
  images: {
    remotePatterns: [],
  },
  devIndicators: false,
};

export default nextConfig;
