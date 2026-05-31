import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://famile.xyz";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: "FamilyXYZ - AI-Powered Family Connection",
    description:
        "AI-powered family wellness and growth platform with multi-agent orchestration",
    openGraph: {
        title: "Five Minds on Today — famile.xyz",
        description: "One story from the zeitgeist, five distinct perspectives from your family agents.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
