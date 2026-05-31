'use client';

import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

interface BondScorePoint {
    day: string;
    score: number;
    target: number;
}

interface BondScoreChartProps {
    data?: BondScorePoint[];
    title?: string;
}

const defaultData: BondScorePoint[] = [
    { day: 'Mon', score: 62, target: 70 },
    { day: 'Tue', score: 68, target: 72 },
    { day: 'Wed', score: 65, target: 72 },
    { day: 'Thu', score: 72, target: 75 },
    { day: 'Fri', score: 78, target: 75 },
    { day: 'Sat', score: 82, target: 78 },
    { day: 'Sun', score: 85, target: 80 },
];

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-card border rounded-lg p-3 shadow-lg">
            <p className="text-sm font-medium text-foreground mb-1">{label}</p>
            {payload.map((entry: any, idx: number) => (
                <p
                    key={idx}
                    className="text-sm"
                    style={{ color: entry.color }}
                >
                    {entry.name}: {entry.value}
                </p>
            ))}
        </div>
    );
}

export function BondScoreChart({
    data = defaultData,
    title = 'Bond Score Trend',
}: BondScoreChartProps) {
    const latestScore = data[data.length - 1]?.score ?? 0;
    const trend = latestScore - data[0]?.score;

    return (
        <div className="bg-card border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Last 7 days
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold">{latestScore}</p>
                    <p className={`text-xs ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trend >= 0 ? '+' : ''}{trend} this week
                    </p>
                </div>
            </div>

            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                            dataKey="day"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                        />
                        <YAxis
                            domain={[0, 100]}
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#a855f7"
                            fill="url(#scoreGradient)"
                            strokeWidth={2}
                            name="Bond Score"
                        />
                        <Line
                            type="monotone"
                            dataKey="target"
                            stroke="hsl(var(--muted-foreground))"
                            strokeWidth={1}
                            strokeDasharray="4 4"
                            name="Target"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 bg-purple-500 rounded" />
                        Bond Score
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border border-dashed border-muted-foreground rounded" />
                        Target
                    </span>
                </div>
                <span>
                    {trend >= 0 ? 'Improving' : 'Needs attention'}
                </span>
            </div>
        </div>
    );
}
