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
                return "text-green-600 dark:text-green-400";
            case "negative":
                return "text-red-600 dark:text-red-400";
            default:
                return "text-foreground";
        }
    };

    return (
        <Card
            className="hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            role="region"
            aria-label={`${title}: ${value}`}
        >
            <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className={`text-xl sm:text-2xl font-bold ${getValueColor()} mb-1 sm:mb-2`}>
                    {value}
                </div>
                {subtitle && (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
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
                                className="h-4 bg-muted rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        </CardHeader>
                        <CardContent>
                            <div
                                className="h-8 bg-muted rounded animate-pulse"
                                style={{ animationDelay: `${i * 0.1}s` }}
                            />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
            {stats?.latestTransactionId && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 bg-green-500/100/10 border border-green-500/20 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500/100" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-400">
                            Hedera Consensus Verified
                        </span>
                    </div>
                    <a
                        href={`https://hashscan.io/testnet/transaction/${stats.latestTransactionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-green-600 dark:text-green-400 hover:underline font-mono truncate max-w-full sm:max-w-[200px]"
                    >
                        Tx: {stats.latestTransactionId}
                    </a>
                </div>
            )}
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
