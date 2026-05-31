import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "FamilyXYZ - AI-Powered Family Connection",
    description:
        "AI-powered family wellness and growth platform with multi-agent orchestration",
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
