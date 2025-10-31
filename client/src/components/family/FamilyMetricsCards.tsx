import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamilyMetrics } from "@/hooks/useFamilyData";
import { getHealthDescription } from "@/utils/healthScore";
import type { FamilyStats } from "@/types/family";

interface FamilyMetricsCardsProps {
    stats: FamilyStats | undefined;
    isLoading?: boolean;
}

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: "default" | "positive" | "negative";
}

const MetricCard = ({
    title,
    value,
    subtitle,
    variant = "default",
}: MetricCardProps) => {
    const getValueColor = () => {
        switch (variant) {
            case "positive":
                return "text-green-700";
            case "negative":
                return "text-red-700";
            default:
                return "text-gray-900";
        }
    };

    return (
        <Card
            className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white border-gray-200"
            role="region"
            aria-label={`${title}: ${value}`}
        >
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className={`text-2xl font-bold ${getValueColor()} mb-2`}>
                    {value}
                </div>
                {subtitle && (
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

export const FamilyMetricsCards = ({
    stats,
    isLoading,
}: FamilyMetricsCardsProps) => {
    const metrics = useFamilyMetrics(stats);

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card
                        key={i}
                        className="bg-gradient-to-br from-gray-50 to-gray-100"
                    >
                        <CardHeader className="pb-2">
                            <div
                                className="h-4 bg-gray-200 rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        </CardHeader>
                        <CardContent>
                            <div
                                className="h-8 bg-gray-200 rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
                title="💝 Family Connection"
                value={`${metrics.healthScore}%`}
                subtitle={getHealthDescription(metrics.healthScore)}
                variant={
                    metrics.healthScore >= 70
                        ? "positive"
                        : metrics.healthScore >= 50
                          ? "default"
                          : "negative"
                }
            />
            <MetricCard
                title="💬 Conversations"
                value={metrics.total}
                subtitle="Meaningful exchanges this week"
            />
            <MetricCard
                title="✨ Positive Moments"
                value={metrics.positive}
                subtitle="Joyful interactions shared"
                variant="positive"
            />
            <MetricCard
                title="🌱 Growth Areas"
                value={metrics.negative}
                subtitle="Opportunities to flourish together"
                variant="negative"
            />
        </div>
    );
};
