import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.famile.xyz";

export const dynamic = "force-dynamic";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ familyId: string }> },
) {
    const { familyId } = await params;

    try {
        const res = await fetch(
            `${API_BASE}/api/families/${encodeURIComponent(familyId)}/bond-score`,
            { cache: "no-store" },
        );

        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
    } catch (err) {
        console.error("Bond score proxy error:", err);
        return NextResponse.json(
            { error: "Failed to fetch bond score" },
            { status: 502 },
        );
    }
}
