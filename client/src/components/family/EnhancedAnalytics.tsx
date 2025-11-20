// Enhanced analytics dashboard with predictive capabilities
// Implements advanced family health analytics and forecasting

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    TrendingUp,
    TrendingDown,
    Activity,
    Target,
    Zap,
    Brain,
    Heart,
    Users,
    Leaf,
    Rocket,
} from "lucide-react";
import {
    predictHealthScore,
    calculateTrend,
    generateRecommendations,
    calculateVolatility,
} from "@/lib/predictiveAnalytics";
import type { FamilyStats, FamilyHistory } from "@/types/family";

interface EnhancedAnalyticsProps {
    stats: FamilyStats | undefined;
    history: FamilyHistory | undefined;
    isLoading?: boolean;
}

export const EnhancedAnalytics: React.FC<EnhancedAnalyticsProps> = ({
    stats,
    history,
    isLoading = false,
}) => {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div
                    className="h-4 bg-gray-200 rounded animate-pulse"
                    style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                    className="h-4 bg-gray-200 rounded animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                ></div>
            </div>
        );
    }

    const trend = calculateTrend(history);
    const predictedScore = predictHealthScore(history);
    const currentScore = stats?.healthScore || 80;
    const volatility = calculateVolatility(history);
    const recommendations = generateRecommendations(stats, history);

    const getTrendIcon = () => {
        switch (trend) {
            case "increasing":
                return <TrendingUp className="w-5 h-5 text-green-500" />;
            case "decreasing":
                return <TrendingDown className="w-5 h-5 text-red-500" />;
            default:
                return <Activity className="w-5 h-5 text-blue-500" />;
        }
    };

    const getTrendColor = () => {
        switch (trend) {
            case "increasing":
                return "text-green-600";
            case "decreasing":
                return "text-red-600";
            default:
                return "text-blue-600";
        }
    };

    const getTrendText = () => {
        switch (trend) {
            case "increasing":
                return "Improving";
            case "decreasing":
                return "Declining";
            default:
                return "Stable";
        }
    };

    return (
        <div className="space-y-6">
            {/* Prediction Card */}
            <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-purple-600" />
                        <span>Family Health Forecast</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                            <div className="text-2xl font-bold text-gray-900">
                                {currentScore}%
                            </div>
                            <div className="text-sm text-gray-600">
                                Current Score
                            </div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                            <div className="text-2xl font-bold text-gray-900">
                                {predictedScore}%
                            </div>
                            <div className="text-sm text-gray-600">
                                Predicted (7 days)
                            </div>
                        </div>
                        <div className="text-center p-4 bg-white rounded-lg border border-purple-200">
                            <div className="flex items-center justify-center space-x-1">
                                {getTrendIcon()}
                                <span
                                    className={`font-bold ${getTrendColor()}`}
                                >
                                    {getTrendText()}
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">Trend</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Volatility Card */}
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Stability Index</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-gray-900">
                                {volatility}
                            </div>
                            <div className="text-sm text-gray-600">
                                Volatility Score (0-100)
                            </div>
                        </div>
                        <div className="w-24 h-24">
                            <div className="relative w-full h-full">
                                <svg
                                    viewBox="0 0 36 36"
                                    className="w-full h-full"
                                >
                                    <path
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke="#e6e6e6"
                                        strokeWidth="3"
                                    />
                                    <path
                                        d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                                        fill="none"
                                        stroke={
                                            volatility > 50
                                                ? "#ef4444"
                                                : volatility > 30
                                                  ? "#f59e0b"
                                                  : "#10b981"
                                        }
                                        strokeWidth="3"
                                        strokeDasharray={`${volatility}, 100`}
                                    />
                                    <text
                                        x="18"
                                        y="20.5"
                                        textAnchor="middle"
                                        fill="#4b5563"
                                        fontSize="8"
                                    >
                                        {volatility}
                                    </text>
                                </svg>
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                        {volatility > 50
                            ? "High variability detected. Consider establishing consistent routines."
                            : volatility > 30
                              ? "Moderate stability. Some consistency improvements could help."
                              : "Excellent stability in family interactions."}
                    </div>
                </CardContent>
            </Card>

            {/* Agent-Specific Insights */}
            {stats && (
                <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Zap className="w-5 h-5 text-green-600" />
                            <span>Agent Insights</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <Brain className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">
                                    {stats.intimacy?.affection ?? 0}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Affection
                                </div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <Heart className="w-6 h-6 text-pink-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">
                                    {stats.presence?.attention ?? 0}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Attention
                                </div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <Users className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">
                                    {stats.generational?.bridge ?? 0}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Bridge
                                </div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <Leaf className="w-6 h-6 text-green-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">
                                    {stats.presence?.distraction ?? 0}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Distraction
                                </div>
                            </div>
                            <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                                <Rocket className="w-6 h-6 text-orange-500 mx-auto mb-1" />
                                <div className="text-lg font-bold text-gray-900">
                                    {stats.growth?.growth ?? 0}
                                </div>
                                <div className="text-xs text-gray-600">
                                    Growth
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            <Card className="border-0 bg-gradient-to-br from-amber-50 to-orange-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-amber-600" />
                        <span>Actionable Recommendations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {recommendations.map((rec, index: number) => (
                            <li
                                key={index}
                                className="flex items-start space-x-2"
                            >
                                <Badge
                                    variant="secondary"
                                    className="mt-0.5 flex-shrink-0"
                                >
                                    {index + 1}
                                </Badge>
                                <span className="text-sm text-gray-800">
                                    {rec}
                                </span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
};
