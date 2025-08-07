import { Line } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createLineChartData, lineChartOptions } from "@/lib/chartConfig";
import type { FamilyHistory } from "@/types/family";

interface FamilyLineChartProps {
  history: FamilyHistory | undefined;
  isLoading?: boolean;
}

export const FamilyLineChart = ({ history, isLoading }: FamilyLineChartProps) => {
  const chartData = createLineChartData(history);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading trend...</div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="text-muted-foreground">No trend data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <Line data={chartData} options={lineChartOptions} />
      </CardContent>
    </Card>
  );
};