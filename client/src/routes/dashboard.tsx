import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import ConsentModal from "@/components/consent-modal";
import { FamilyMetricsCards } from "@/components/family";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ChatInterface } from "@/components/ChatInterface";
import { apiClient } from "@/lib/api";
import { FamilyStats, FamilyHistory } from "@/types/family";
import "chart.js/auto";
import { Radar, Line } from "react-chartjs-2";
import { 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Calendar,
  Clock,
  Users,
  Star,
  ArrowUp,
  Target
} from "lucide-react";

// Enhanced connection opportunities with better structure
const connectionOpportunities = [
  {
    id: 1,
    title: "Family Game Night",
    description: "Schedule a weekly game night to strengthen bonds and create lasting memories",
    priority: "high",
    estimatedTime: "2 hours",
    category: "activity",
    difficulty: "easy",
    icon: "🎲",
    benefits: ["Bonding", "Fun", "Communication"]
  },
  {
    id: 2,
    title: "Cooking Together",
    description: "Try cooking a new recipe as a family and share stories while preparing meals",
    priority: "medium", 
    estimatedTime: "1 hour",
    category: "activity",
    difficulty: "medium",
    icon: "👨‍🍳",
    benefits: ["Teamwork", "Learning", "Tradition"]
  },
  {
    id: 3,
    title: "Nature Walk & Stories",
    description: "Take a peaceful walk in the park and share meaningful stories together",
    priority: "low",
    estimatedTime: "30 minutes",
    category: "conversation",
    difficulty: "easy",
    icon: "🌳",
    benefits: ["Mindfulness", "Exercise", "Connection"]
  }
];

// Enhanced loading skeleton with better visual hierarchy
const DashboardSkeleton = () => (
  <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
    {/* Header skeleton */}
    <div className="space-y-4">
      <div className="h-8 w-64 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg animate-pulse" />
      <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
    </div>
    
    {/* Metrics cards skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 rounded mb-2" />
            <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 to-gray-300 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
    
    {/* Charts skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse" />
      <div className="h-80 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse" />
    </div>
    
    {/* Bottom section skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse" />
      <div className="lg:col-span-2 h-64 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl animate-pulse" />
    </div>
  </div>
);

// Enhanced chart component with better visual design
function ChartCard({ stats }: { stats: FamilyStats | undefined }) {
  if (!stats) return null;

  const data = {
    labels: [
      'Health Score',
      'Intimacy', 
      'Presence',
      'Generational Bridge',
      'Growth',
      'Overall Positive'
    ],
    datasets: [
      {
        label: 'Family Dynamics',
        data: [
          stats.healthScore,
          stats.intimacy?.affection || 0,
          stats.presence?.attention || 0,
          stats.generational?.bridge || 0,
          stats.growth?.growth || 0,
          stats.positive
        ],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 0.8)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(99, 102, 241, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          display: false,
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-indigo-600" />
          Family Dynamics Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Radar data={data} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced line chart with better visual design
function LineChartCard({ history }: { history: FamilyHistory | undefined }) {
  if (!history || !history.timeline) return null;

  const data = {
    labels: history.timeline.map(point => new Date(point.ts).toLocaleDateString()),
    datasets: [
      {
        label: 'Health Score',
        data: history.timeline.map(point => point.health),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: 'rgba(0, 0, 0, 0.6)',
        },
      },
    },
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          Health Score Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: '300px' }}>
          <Line data={data} options={options as any} />
        </div>
      </CardContent>
    </Card>
  );
}

// Enhanced Connection Opportunities Component
function EnhancedConnectionOpportunities() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Connection Opportunities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectionOpportunities.map((opportunity) => (
          <div
            key={opportunity.id}
            className="group p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{opportunity.icon}</span>
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {opportunity.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(opportunity.priority)}`}
                    >
                      {opportunity.priority} priority
                    </Badge>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {opportunity.estimatedTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-3 leading-relaxed">
              {opportunity.description}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {opportunity.benefits.map((benefit, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {benefit}
                  </Badge>
                ))}
              </div>
              <Button size="sm" variant="outline" className="group-hover:bg-blue-50 group-hover:border-blue-300">
                Schedule
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [consentOpen, setConsentOpen] = useState(false);

  useEffect(() => {
    // Check if user has given consent
    const hasConsent = localStorage.getItem('familyConsent');
    if (!hasConsent) {
      setConsentOpen(true);
    }
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['familyStats'],
    queryFn: apiClient.getFamilyStats,
  });

  const { data: history } = useQuery({
    queryKey: ['familyHistory'],
    queryFn: () => apiClient.getFamilyHistory("/family/stats/history/db"),
  });

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <ErrorBoundary>
      <div className="flex-1 space-y-8 p-4 md:p-8 pt-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
        {/* Enhanced Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-600 bg-clip-text text-transparent">
                Family Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Track your family's connection and growth journey
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Star className="h-3 w-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
        
        {/* Enhanced Family Health Score Overview */}
        <div className="space-y-6">
          <FamilyMetricsCards stats={data} isLoading={isLoading} />
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard stats={data} />
          <LineChartCard history={history} />
        </div>

        {/* Chat Interface Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>
          
          {/* Family Health Score Details */}
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Health Score Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Score</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {data?.healthScore || 0}%
                    </span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      +2%
                    </Badge>
                  </div>
                </div>
                <Progress value={data?.healthScore || 0} className="h-2" />
              </div>
              
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Positive Interactions</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data?.positive || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-pink-500" />
                    <span className="text-sm text-gray-600">Intimacy</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data?.intimacy?.affection || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-gray-600">Presence</span>
                  </div>
                  <span className="font-semibold text-gray-900">{data?.presence?.attention || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enhanced Connection Opportunities */}
          <div className="lg:col-span-3">
            <EnhancedConnectionOpportunities />
          </div>
        </div>

        <ConsentModal 
          open={consentOpen} 
          onConsent={(accepted, scopes) => {
            setConsentOpen(false);
            if (accepted) {
              localStorage.setItem('familyConsent', JSON.stringify({ accepted, scopes, timestamp: Date.now() }));
            }
            console.log('Consent:', accepted, scopes);
          }}
        />
      </div>
    </ErrorBoundary>
  );
}
