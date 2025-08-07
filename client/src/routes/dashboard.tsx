import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ConsentModal from "@/components/consent-modal";
import { 
  FamilyRadarChart, 
  FamilyLineChart, 
  FamilyMetricsCards, 
  ConnectionOpportunities 
} from "@/components/family";
import { useFamilyStats, useFamilyHistory } from "@/hooks/useFamilyData";
import { useConsent } from "@/hooks/useConsent";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "chart.js/auto";

// Loading fallback component - CLEAN principle
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-muted animate-pulse rounded-lg" />
      <div className="h-80 bg-muted animate-pulse rounded-lg" />
    </div>
  </div>
);

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

function LineChartCard({ history }: { history: FamilyHistory | undefined }) {
  if (!history || !history.timeline.length) return null;
  const data = {
    labels: history.timeline.map((d: any) => new Date(d.ts).toLocaleTimeString()),
    datasets: [
      {
        label: "Health Score",
        data: history.timeline.map((d: any) => d.health),
        fill: false,
        borderColor: "rgba(75,192,192,1)",
        tension: 0.3,
        pointRadius: 1,
      },
    ],
  };
  const options = {
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Health Score" },
      },
      x: {
        title: { display: false },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  };
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Health Score Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-4"><Line data={data} options={options as any} height={200} /></div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("familyConsent")) {
      setConsentOpen(true);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["familyStats"],
    queryFn: apiClient.getFamilyStats,
    refetchInterval: 5000,
  });

  const { data: history } = useQuery({
    queryKey: ["familyStatsHistory"],
    queryFn: () => apiClient.getFamilyHistory("/family/stats/history/db"),
    refetchInterval: 10000,
  });

  const healthScore =
    !isLoading && data ? Math.round(data.healthScore) : 80;
  const total = data?.total ?? "-";
  const positive = data?.positive ?? "-";
  const negative = data?.negative ?? "-";

  function handleConsent(accepted: boolean, scopes?: any) {
    if (accepted) {
      localStorage.setItem("familyConsent", "accepted");
      if (scopes) {
        localStorage.setItem("familyConsentScopes", JSON.stringify(scopes));
      }
      setConsentOpen(false);
    } else {
      setConsentOpen(false);
      navigate("/about");
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <ConsentModal open={consentOpen} onConsent={handleConsent} />
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
        <LineChartCard history={history} />
      </div>
      <Separator />
      <p className="mt-6 text-gray-500 text-sm">
        More insights, reminders, and personalized suggestions coming soon!
      </p>
    </div>
  );
}