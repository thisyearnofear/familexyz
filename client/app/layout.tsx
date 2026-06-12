import type { Metadata } from "next";
import "./globals.css";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/components/providers";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://famile.xyz";

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: "famile.xyz — Daily Council",
    description:
        "Five minds on today's world. AI-powered family council with Wisdom, Intimacy, Presence, Growth, and Bridge — your daily perspectives on what matters.",
    openGraph: {
        title: "Five Minds on Today — famile.xyz",
        description: "One story from the zeitgeist, five distinct perspectives from your family agents. Daily council for stronger connections.",
        siteName: "famile.xyz",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Five Minds on Today — famile.xyz",
        description: "One story from the zeitgeist, five distinct perspectives. Your family's daily council.",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body className={`font-sans antialiased ${fontVariables}`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
