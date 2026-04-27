import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/about-me",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
