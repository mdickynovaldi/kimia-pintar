import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Uploads (avatar / cover / material images) go through Server Actions;
    // the default 1 MB cap is too small for real photos.
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
