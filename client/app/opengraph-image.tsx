import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const contentType = 'image/png';
export const size = { width: 1200, height: 630 };

export default async function OGImage({
    searchParams,
}: {
    searchParams: Promise<{ headline?: string }>;
}) {
    const { headline } = await searchParams;
    const title = headline || 'Five Minds on Today';
    const displayTitle = title.length > 80 ? title.slice(0, 77) + '...' : title;

    return new ImageResponse(
        (
            <div
                style={{
                    width: 1200,
                    height: 630,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #4f46e5 100%)',
                    padding: 60,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 20,
                    }}
                >
                    <span style={{ fontSize: 56 }}>🏛️</span>
                    <h1
                        style={{
                            fontSize: 60,
                            fontWeight: 700,
                            color: 'white',
                            textAlign: 'center',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.15,
                            margin: 0,
                            maxWidth: 900,
                        }}
                    >
                        {displayTitle}
                    </h1>
                    <p
                        style={{
                            fontSize: 26,
                            color: 'rgba(255,255,255,0.65)',
                            textAlign: 'center',
                            margin: 0,
                        }}
                    >
                        Five perspectives from your family agents
                    </p>
                    <div
                        style={{
                            display: 'flex',
                            gap: 24,
                            marginTop: 16,
                        }}
                    >
                        {['🧠', '💖', '🧘', '🌱', '🧓'].map((emoji, i) => (
                            <span key={i} style={{ fontSize: 32 }}>{emoji}</span>
                        ))}
                    </div>
                    <div
                        style={{
                            marginTop: 24,
                            fontSize: 16,
                            color: 'rgba(255,255,255,0.4)',
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}
                    >
                        famile.xyz · Daily Council
                    </div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
        }
    );
}
