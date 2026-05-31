import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    experimental: {
        optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    },
    async headers() {
        return [
            {
                source: "/((?!_next/static|_next/image|favicon).*)",
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
