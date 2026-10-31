import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['sharp'],
  // Permet d'utiliser un dossier de build alternatif si `.next` est verrouillé
  // (ex. sur volume exFAT) : NEXT_DIST_DIR=.next-work npm run dev
  distDir: process.env.NEXT_DIST_DIR || '.next',
};

export default nextConfig;
