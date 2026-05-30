'use client';

import React from "react";

// Minimal demo dashboard for the hackathon MVP
// Full dashboard components will be progressively ported

export const EnhancedFamilyDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white px-6 py-8 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                                Family Connection Hub
                            </h1>
                            <p className="text-xs sm:text-sm lg:text-base text-white/90 drop-shadow mt-1">
                                AI-powered family wellness and growth platform
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <span className="w-2 h-2 bg-green-300 rounded-full" />
                                <span className="font-semibold text-white text-sm">
                                    System Online
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Status cards */}
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Family Health
                        </h3>
                        <p className="text-3xl font-bold text-foreground">
                            85%
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Excellent bond strength
                        </p>
                    </div>
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Active Agents
                        </h3>
                        <p className="text-3xl font-bold text-foreground">
                            5
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Wisdom, Intimacy, Presence, Generational, Growth
                        </p>
                    </div>
                    <div className="bg-card border rounded-xl p-6">
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">
                            Platform Status
                        </h3>
                        <p className="text-3xl font-bold text-green-500">
                            Operational
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            All systems healthy
                        </p>
                    </div>
                </div>

                <div className="mt-8 bg-card border rounded-xl p-6">
                    <h2 className="text-lg font-semibold mb-4">
                        Welcome to FamilyXYZ
                    </h2>
                    <p className="text-muted-foreground">
                        Your AI-powered platform for family connection, wellness,
                        and growth. The dashboard is being progressively updated
                        with enhanced features. Check out the{" "}
                        <a
                            href="/hackathon"
                            className="text-purple-400 hover:text-purple-300 underline"
                        >
                            Hackathon Demo
                        </a>{" "}
                        for the latest agent grid interface.
                    </p>
                </div>
            </div>
        </div>
    );
};
