import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },
    async headers() {
        return [
            {
                source: "/_next/static/(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, max-age=31536000, immutable",
                    },
                ],
            },
            {
                source: "/api/today",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "public, s-maxage=3600, stale-while-revalidate=86400",
                    },
                ],
            },
            {
                source: "/api/(.*)",
                headers: [
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
