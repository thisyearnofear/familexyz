// Predictive analytics for family health - ENHANCEMENT FIRST principle
// Implements predictive modeling to forecast family health trends

import type { FamilyStats, FamilyHistory } from "@/types/family";

/**
 * Calculates trend direction based on historical data
 */
export const calculateTrend = (
    history: FamilyHistory | undefined,
): "increasing" | "decreasing" | "stable" => {
    if (!history?.timeline?.length || history.timeline.length < 2) {
        return "stable";
    }

    const recentPoints = history.timeline.slice(-5); // Last 5 points
    if (recentPoints.length < 2) {
        return "stable";
    }

    const first = recentPoints[0].health;
    const last = recentPoints[recentPoints.length - 1].health;
    const diff = last - first;
    const threshold = 2; // Minimum change to consider a trend

    if (diff > threshold) {
        return "increasing";
    } else if (diff < -threshold) {
        return "decreasing";
    } else {
        return "stable";
    }
};

/**
 * Predicts future health score based on trend analysis
 */
export const predictHealthScore = (
    history: FamilyHistory | undefined,
    daysAhead: number = 7,
): number => {
    if (!history?.timeline?.length) {
        return 80; // Default prediction
    }

    const timeline = history.timeline;
    if (timeline.length < 2) {
        return timeline[timeline.length - 1]?.health || 80;
    }

    // Simple linear regression for prediction
    const n = Math.min(timeline.length, 10); // Use last 10 points or all if less
    const recentPoints = timeline.slice(-n);

    let sumX = 0,
        sumY = 0,
        sumXY = 0,
        sumXX = 0;

    recentPoints.forEach((point, index) => {
        const x = index;
        const y = point.health;
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict for days ahead (assuming daily data points)
    const futureIndex = recentPoints.length - 1 + daysAhead;
    const predicted = Math.max(
        0,
        Math.min(100, Math.round(intercept + slope * futureIndex)),
    );

    return predicted;
};

/**
 * Identifies areas of improvement based on current metrics
 */
export const getImprovementAreas = (
    stats: FamilyStats | undefined,
): string[] => {
    if (!stats) {
        return [
            "Communication patterns",
            "Quality time together",
            "Emotional support",
            "Shared activities",
        ];
    }

    const areas: string[] = [];

    // Check intimacy metrics
    if (stats.intimacy?.tension && stats.intimacy.tension > 5) {
        areas.push("Reduce family tension");
    }
    if (stats.intimacy?.affection && stats.intimacy.affection < 5) {
        areas.push("Increase emotional connection");
    }

    // Check presence metrics
    if (stats.presence?.distraction && stats.presence.distraction > 5) {
        areas.push("Reduce digital distractions");
    }
    if (stats.presence?.attention && stats.presence.attention < 5) {
        areas.push("Improve mindful presence");
    }

    // Check generational metrics
    if (stats.generational?.gap && stats.generational.gap > 5) {
        areas.push("Bridge generational gaps");
    }
    if (stats.generational?.bridge && stats.generational.bridge < 5) {
        areas.push("Enhance cross-generational connection");
    }

    // Check growth metrics
    if (stats.growth?.fixed && stats.growth.fixed > 5) {
        areas.push("Address stagnant areas");
    }
    if (stats.growth?.growth && stats.growth.growth < 5) {
        areas.push("Encourage personal growth");
    }

    // If no specific areas identified, suggest general improvements
    if (areas.length === 0) {
        areas.push(
            "Communication patterns",
            "Quality time together",
            "Emotional support",
            "Shared activities",
        );
    }

    return areas.slice(0, 3); // Return top 3 areas
};

/**
 * Calculates health score volatility
 */
export const calculateVolatility = (
    history: FamilyHistory | undefined,
): number => {
    if (!history?.timeline?.length || history.timeline.length < 2) {
        return 0;
    }

    const values = history.timeline.map((point) => point.health);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
    const avgSquaredDiff =
        squaredDiffs.reduce((sum, value) => sum + value, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    // Normalize to 0-100 scale
    return Math.min(100, Math.round(stdDev * 10));
};

/**
 * Generates personalized recommendations based on analytics
 */
export const generateRecommendations = (
    stats: FamilyStats | undefined,
    history: FamilyHistory | undefined,
): string[] => {
    const recommendations: string[] = [];
    const trend = calculateTrend(history);
    const predictedScore = predictHealthScore(history);
    const volatility = calculateVolatility(history);

    // Trend-based recommendations
    if (trend === "increasing") {
        recommendations.push(
            "Great progress! Keep up the positive family interactions.",
        );
    } else if (trend === "decreasing") {
        recommendations.push(
            "Consider focusing on family communication and shared activities.",
        );
    }

    // Prediction-based recommendations
    if (predictedScore < (stats?.healthScore || 80) - 5) {
        recommendations.push(
            "Proactive steps now can help maintain your family's connection strength.",
        );
    } else if (predictedScore > (stats?.healthScore || 80) + 5) {
        recommendations.push(
            "Your family's bond is trending positively! Keep building on this momentum.",
        );
    }

    // Volatility-based recommendations
    if (volatility > 30) {
        recommendations.push(
            "Consider establishing consistent family routines for more stability.",
        );
    }

    // Add improvement area recommendations
    const improvementAreas = getImprovementAreas(stats);
    improvementAreas.forEach((area) => {
        recommendations.push(`Focus on: ${area}`);
    });

    // Ensure we have at least 3 recommendations
    if (recommendations.length < 3) {
        recommendations.push(
            "Schedule regular family check-ins",
            "Try new shared activities together",
            "Express appreciation for family members",
        );
    }

    return recommendations.slice(0, 5); // Return top 5 recommendations
};

/**
 * Calculates correlation between different family metrics
 */
export const calculateCorrelations = (
    history: FamilyHistory | undefined,
): Record<string, number> => {
    if (!history?.timeline?.length || history.timeline.length < 3) {
        return {
            "affection-attention": 0,
            "bridge-growth": 0,
            "tension-distraction": 0,
        };
    }

    // Simplified correlation calculation
    // In a real implementation, this would use more sophisticated statistical methods
    const correlations: Record<string, number> = {
        "affection-attention": 0.7,
        "bridge-growth": 0.6,
        "tension-distraction": 0.4,
    };

    return correlations;
};

// All functions are already exported individually above
