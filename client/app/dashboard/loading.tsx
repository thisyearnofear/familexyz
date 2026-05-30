import React from "react";

export default function DashboardLoading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">
                    Loading dashboard...
                </span>
            </div>
        </div>
    );
}
