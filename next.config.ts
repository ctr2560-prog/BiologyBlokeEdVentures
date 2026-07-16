import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "https", hostname: "akvxwcnrpdjctkvpupxx.supabase.co" },
    ],
  },
};

export default nextConfig;
