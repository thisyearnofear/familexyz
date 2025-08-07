import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFamilyMetrics } from "@/hooks/useFamilyData";
import { getHealthColor, getHealthDescription } from "@/utils/healthScore";
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

const MetricCard = ({ title, value, subtitle, variant = "default" }: MetricCardProps) => {
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${getValueColor()}`}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
};

export const FamilyMetricsCards = ({ stats, isLoading }: FamilyMetricsCardsProps) => {
  const metrics = useFamilyMetrics(stats);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        title="Family Health"
        value={`${metrics.healthScore}%`}
        subtitle={getHealthDescription(metrics.healthScore)}
        variant={metrics.healthScore >= 70 ? "positive" : metrics.healthScore >= 50 ? "default" : "negative"}
      />
      <MetricCard
        title="Total Interactions"
        value={metrics.total}
        subtitle="Messages analyzed"
      />
      <MetricCard
        title="Positive Sentiment"
        value={metrics.positive}
        subtitle="Uplifting messages"
        variant="positive"
      />
      <MetricCard
        title="Growth Opportunities"
        value={metrics.negative}
        subtitle="Areas for improvement"
        variant="negative"
      />
    </div>
  );
};