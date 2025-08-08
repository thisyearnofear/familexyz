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
        return "text-green-600";
      case "negative":
        return "text-red-600";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${getValueColor()} mb-1`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
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
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
        subtitle="Meaningful exchanges"
      />
      <MetricCard
        title="✨ Positive Moments"
        value={metrics.positive}
        subtitle="Joyful interactions"
        variant="positive"
      />
      <MetricCard
        title="🌱 Growth Areas"
        value={metrics.negative}
        subtitle="Opportunities to flourish"
        variant="negative"
      />
    </div>
  );
};
