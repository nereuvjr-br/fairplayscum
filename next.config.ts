import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow Steam avatars served from avatars.steamstatic.com
    // Using remotePatterns to avoid deprecation of `images.domains`.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
