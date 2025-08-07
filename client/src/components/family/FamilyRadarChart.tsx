import { Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRadarChartData, radarChartOptions } from "@/lib/chartConfig";
import type { FamilyStats } from "@/types/family";

interface FamilyRadarChartProps {
  stats: FamilyStats | undefined;
  isLoading?: boolean;
}

export const FamilyRadarChart = ({ stats, isLoading }: FamilyRadarChartProps) => {
  const chartData = createRadarChartData(stats);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Family Dynamics</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Family Dynamics</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <Radar data={chartData} options={radarChartOptions} />
      </CardContent>
    </Card>
  );
};