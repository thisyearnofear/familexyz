"use client";

export default function NotFound() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-purple-500 mb-4">404</h1>
                <p className="text-lg text-zinc-400 mb-6">Page not found</p>
                <a
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors text-sm"
                >
                    Go to Dashboard
                </a>
            </div>
        </div>
    );
}
