'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="en">
            <body style={{ margin: 0 }}>
                <div style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1a1614", color: "#e8e0d8" }}>
                    <div style={{ textAlign: "center" }}>
                        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Something went wrong</h1>
                        <button
                            onClick={() => reset()}
                            style={{
                                padding: "0.5rem 1.5rem",
                                cursor: "pointer",
                                border: "1px solid #4a4040",
                                borderRadius: "8px",
                                background: "transparent",
                                color: "#e8e0d8",
                                fontSize: "0.875rem",
                            }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
