import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, FamilyStats } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Radar } from "react-chartjs-2";
import Chart from "chart.js/auto"; // Chart.js registration

const connectionOpportunities = [
  { title: "Family Game Night", description: "Friday, 7pm – Try a new board game together." },
  { title: "Mindful Walk", description: "Saturday morning – Tech-free walk in the park." },
  { title: "Story Swap", description: "Sunday, 4pm – Share family stories across generations." },
];

function ChartCard({ stats }: { stats: FamilyStats | undefined }) {
  const data = {
    labels: [
      "Affection",
      "Tension",
      "Attention",
      "Distraction",
      "Bridge",
      "Gap",
      "Growth",
      "Fixed"
    ],
    datasets: [
      {
        label: "Family Metrics",
        data: [
          stats?.intimacy?.affection || 0,
          stats?.intimacy?.tension || 0,
          stats?.presence?.attention || 0,
          stats?.presence?.distraction || 0,
          stats?.generational?.bridge || 0,
          stats?.generational?.gap || 0,
          stats?.growth?.growth || 0,
          stats?.growth?.fixed || 0,
        ],
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        borderColor: "rgba(54, 162, 235, 1)",
        pointBackgroundColor: "rgba(54, 162, 235, 1)",
      }
    ]
  };

  const options = {
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 5
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Family Dynamics Radar</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4">
          <Radar data={data} options={options as any} height={320} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["familyStats"],
    queryFn: apiClient.getFamilyStats,
    refetchInterval: 5000,
  });

  const healthScore =
    !isLoading && data ? Math.round(data.healthScore) : 80;
  const total = data?.total ?? "-";
  const positive = data?.positive ?? "-";
  const negative = data?.negative ?? "-";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Family Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Family Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <span className="text-5xl font-semibold text-green-600">{healthScore}%</span>
              <span className="text-gray-500">
                {healthScore >= 75
                  ? "Strong connection"
                  : healthScore >= 50
                  ? "Moderate connection"
                  : "Needs attention"}
              </span>
            </div>
            <div className="mt-4 text-sm text-gray-500 flex gap-6">
              <div>
                <span className="font-semibold">{total}</span> messages
              </div>
              <div>
                <span className="font-semibold text-green-600">{positive}</span> positive
              </div>
              <div>
                <span className="font-semibold text-red-600">{negative}</span> negative
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Connection Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {connectionOpportunities.map((item, idx) => (
                <li key={idx}>
                  <span className="font-medium">{item.title}:</span> {item.description}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <ChartCard stats={data} />
      </div>
      <Separator />
      <p className="mt-6 text-gray-500 text-sm">
        More insights, reminders, and personalized suggestions coming soon!
      </p>
    </div>
  );
}