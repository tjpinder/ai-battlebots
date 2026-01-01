import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Disable trailing slashes to match SWA's expectations
  trailingSlash: false,
};

export default nextConfig;
