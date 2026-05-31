import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: "export",
    images: {
        unoptimized: true,
    },
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },
};

export default nextConfig;
