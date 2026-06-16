import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../../"),
  images: {
    remotePatterns: [],
  },
  devIndicators: false,
};

export default nextConfig;
