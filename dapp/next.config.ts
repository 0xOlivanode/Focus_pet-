import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "wagmi",
      "@privy-io/react-auth",
      "@privy-io/wagmi",
      "viem",
      "@web3auth/modal",
      "@goodsdks/citizen-sdk",
      "@goodsdks/engagement-sdk",
      "@goodsdks/identity-sdk",
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
