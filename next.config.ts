import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['sharp'],
  outputFileTracing: false,
};

export default nextConfig;
