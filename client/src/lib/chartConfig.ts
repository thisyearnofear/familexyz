import type { ChartData, ChartOptions, FamilyStats, FamilyHistory } from "@/types/family";

// Chart configuration constants - ORGANISED principle
export const CHART_COLORS = {
  primary: "rgba(75, 192, 192, 0.6)",
  primaryBorder: "rgba(75, 192, 192, 1)",
  secondary: "rgba(255, 99, 132, 0.6)",
  secondaryBorder: "rgba(255, 99, 132, 1)",
  success: "rgba(54, 162, 235, 0.6)",
  successBorder: "rgba(54, 162, 235, 1)",
  warning: "rgba(255, 206, 86, 0.6)",
  warningBorder: "rgba(255, 206, 86, 1)",
} as const;

export const RADAR_CHART_LABELS = [
  "Affection",
  "Attention", 
  "Bridge",
  "Growth",
  "Tension",
  "Distraction",
  "Gap",
  "Fixed"
] as const;

// Chart data generators - MODULAR principle
export const createRadarChartData = (stats: FamilyStats | undefined): ChartData => {
  const values = [
    stats?.intimacy?.affection ?? 0,
    stats?.presence?.attention ?? 0,
    stats?.generational?.bridge ?? 0,
    stats?.growth?.growth ?? 0,
    stats?.intimacy?.tension ?? 0,
    stats?.presence?.distraction ?? 0,
    stats?.generational?.gap ?? 0,
    stats?.growth?.fixed ?? 0,
  ];

  return {
    labels: [...RADAR_CHART_LABELS],
    datasets: [
      {
        label: "Family Metrics",
        data: values,
        backgroundColor: CHART_COLORS.primary,
        borderColor: CHART_COLORS.primaryBorder,
      },
    ],
  };
};

export const createLineChartData = (history: FamilyHistory | undefined): ChartData | null => {
  if (!history?.timeline?.length) return null;

  return {
    labels: history.timeline.map((point) => 
      new Date(point.ts).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    ),
    datasets: [
      {
        label: "Health Score",
        data: history.timeline.map((point) => point.health),
        fill: false,
        borderColor: CHART_COLORS.primaryBorder,
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };
};

// Chart options - CLEAN principle
export const radarChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 10,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};

export const lineChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};