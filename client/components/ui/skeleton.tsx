'use client';

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "bar" | "circle" | "text" | "card";
    width?: string;
    height?: string;
}

export function Skeleton({
    className,
    variant = "bar",
    width,
    height,
    ...props
}: SkeletonProps) {
    const base = "t-skel-bar animate-skel-pulse rounded-md bg-editorial-subtle/10";

    if (variant === "circle") {
        return (
            <div
                className={cn(base, "rounded-full", className)}
                style={{ width: width || "40px", height: height || "40px" }}
                {...props}
            />
        );
    }

    if (variant === "text") {
        return (
            <div className={cn("space-y-2", className)} {...props}>
                <div className={cn(base, "h-3 w-full")} />
                <div className={cn(base, "h-3 w-[85%]")} />
                <div className={cn(base, "h-3 w-[60%]")} />
            </div>
        );
    }

    if (variant === "card") {
        return (
            <div
                className={cn(
                    "rounded-2xl border border-editorial-subtle/10 bg-editorial-surface/5 p-6 space-y-4",
                    className
                )}
                {...props}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(base, "h-10 w-10 rounded-full")} />
                    <div className="space-y-2 flex-1">
                        <div className={cn(base, "h-4 w-[40%]")} />
                        <div className={cn(base, "h-3 w-[60%]")} />
                    </div>
                </div>
                <div className={cn(base, "h-3 w-full")} />
                <div className={cn(base, "h-3 w-[85%]")} />
                <div className={cn(base, "h-3 w-[70%]")} />
            </div>
        );
    }

    // Default: bar
    return (
        <div
            className={cn(base, className)}
            style={{ width, height: height || "12px" }}
            {...props}
        />
    );
}

export function PageSkeleton() {
    return (
        <div className="min-h-screen bg-editorial-bg bg-noise">
            <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16 space-y-8">
                <div className="space-y-4">
                    <Skeleton variant="bar" className="h-4 w-24" />
                    <Skeleton variant="bar" className="h-12 w-[80%]" />
                    <Skeleton variant="text" />
                </div>
                <div className="space-y-6">
                    <Skeleton variant="card" />
                    <Skeleton variant="card" />
                    <Skeleton variant="card" />
                </div>
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="min-h-screen bg-editorial-bg bg-noise">
            <div className="max-w-3xl mx-auto px-6 py-10 sm:py-14 space-y-12">
                <Skeleton variant="bar" className="h-10 w-48" />
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                        <Skeleton variant="bar" className="h-4 w-24" />
                        <Skeleton variant="bar" className="h-10 w-16" />
                    </div>
                    <Skeleton variant="bar" className="h-1 w-full" />
                </div>
                <Skeleton variant="bar" className="h-px w-full" />
                <div className="flex flex-wrap gap-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-2">
                            <Skeleton variant="circle" className="h-6 w-6" />
                            <Skeleton variant="bar" className="h-3 w-16" />
                        </div>
                    ))}
                </div>
                <Skeleton variant="bar" className="h-px w-full" />
                <div className="space-y-4">
                    <div className="flex items-baseline justify-between">
                        <Skeleton variant="bar" className="h-4 w-24" />
                        <Skeleton variant="bar" className="h-3 w-12" />
                    </div>
                    <div className="flex items-end gap-1 h-24">
                        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <Skeleton
                                key={i}
                                variant="bar"
                                className="flex-1"
                                style={{ height: `${40 + Math.random() * 60}%` }}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ChatSkeleton() {
    return (
        <div className="flex flex-col h-full bg-editorial-bg">
            <div className="px-6 sm:px-8 pt-8 pb-6 space-y-3">
                <Skeleton variant="bar" className="h-3 w-32" />
                <Skeleton variant="bar" className="h-8 w-48" />
            </div>
            <div className="flex-1 px-4 sm:px-6 py-4">
                <div className="max-w-2xl mx-auto space-y-5">
                    <div className="flex justify-start">
                        <div className="space-y-2 w-[75%]">
                            <Skeleton variant="bar" className="h-3 w-[60%]" />
                            <Skeleton variant="bar" className="h-3 w-full" />
                            <Skeleton variant="bar" className="h-3 w-[40%]" />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Skeleton variant="bar" className="h-12 w-[70%] rounded-xl" />
                    </div>
                    <div className="flex justify-start">
                        <div className="space-y-2 w-[80%]">
                            <Skeleton variant="bar" className="h-3 w-full" />
                            <Skeleton variant="bar" className="h-3 w-[75%]" />
                            <Skeleton variant="bar" className="h-3 w-[50%]" />
                            <Skeleton variant="bar" className="h-3 w-[85%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function LoadingDot() {
    return (
        <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-editorial-accent/40 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-editorial-accent/40 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-1.5 h-1.5 rounded-full bg-editorial-accent/40 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}
