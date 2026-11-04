import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: the whole site is plain files, so it can be hosted anywhere (Vercel, GitHub Pages, Netlify).
  output: "export",
  images: { unoptimized: true },
  // relative asset URLs, so the export also works from a sub-folder (GitHub Pages, previews)
  assetPrefix: "./",
};

export default nextConfig;
