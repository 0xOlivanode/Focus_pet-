import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow ngrok and any tunnel host for local MiniPay testing
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok.io", "*.loca.lt"],
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "wagmi",
      "viem",
      "@supabase/supabase-js",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
