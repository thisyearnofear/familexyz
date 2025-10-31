import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRadarChartData, radarChartOptions } from "@/lib/chartConfig";
import type { FamilyStats } from "@/types/family";

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

interface FamilyRadarChartProps {
  stats: FamilyStats | undefined;
  isLoading?: boolean;
}

export const FamilyRadarChart = ({ stats, isLoading }: FamilyRadarChartProps) => {
  const chartData = createRadarChartData(stats);

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading insights...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-48">
        <Radar
          key="family-radar-chart"
          data={chartData}
          options={radarChartOptions}
        />
      </div>

      {/* Agent Action Suggestions */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 bg-purple-50 rounded border border-purple-200">
          <div className="font-semibold text-purple-800">🧠 Wisdom</div>
          <div className="text-purple-600">Emotional guidance</div>
        </div>
        <div className="p-2 bg-pink-50 rounded border border-pink-200">
          <div className="font-semibold text-pink-800">💑 Intimacy</div>
          <div className="text-pink-600">Relationship coaching</div>
        </div>
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <div className="font-semibold text-blue-800">👵👦 Bridge</div>
          <div className="text-blue-600">Cross-generational</div>
        </div>
        <div className="p-2 bg-green-50 rounded border border-green-200">
          <div className="font-semibold text-green-800">🧘 Presence</div>
          <div className="text-green-600">Mindful wellness</div>
        </div>
      </div>
    </div>
  );
};