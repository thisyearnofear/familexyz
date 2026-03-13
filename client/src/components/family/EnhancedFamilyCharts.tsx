import React from "react";
import { Radar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createRadarChartData, radarChartOptions } from "@/lib/chartConfig";
import type { FamilyStats } from "@/types/family";
import { Heart, Users, Target, TrendingUp, Calendar, Star } from "lucide-react";

interface EnhancedFamilyRadarChartProps {
  stats: FamilyStats | undefined;
  isLoading?: boolean;
}

export const EnhancedFamilyRadarChart = ({ stats, isLoading }: EnhancedFamilyRadarChartProps) => {
  const chartData = createRadarChartData(stats);

  if (isLoading) {
    return (
      <Card className="h-80">
        <CardHeader>
          <CardTitle>Family Connection Map</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading connections...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-red-500" />
            <span>Family Connection Map</span>
          </CardTitle>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span>Current</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-64">
        <Radar 
          data={chartData} 
          options={{
            ...radarChartOptions,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const label = context.label || '';
                    const value = context.parsed.r;
                    return `${label}: ${value}/10`;
                  }
                }
              }
            },
            scales: {
              r: {
                beginAtZero: true,
                max: 10,
                pointLabels: {
                  font: {
                    size: 10,
                    weight: 'bold',
                  },
                },
                grid: {
                  color: 'rgba(75, 85, 99, 0.1)',
                },
                angleLines: {
                  color: 'rgba(75, 85, 99, 0.2)',
                },
              },
            },
          }}
        />
      </CardContent>
    </Card>
  );
};

interface FamilyProgressChartProps {
  dimension: string;
  current: number;
  target: number;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export const FamilyProgressChart: React.FC<FamilyProgressChartProps> = ({
  dimension,
  current,
  target,
  description,
  icon,
  color
}) => {
  const percentage = Math.min(100, (current / target) * 100);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${color}`}>
              {icon}
            </div>
            <div>
              <h4 className="font-semibold text-foreground">{dimension}</h4>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-foreground">{current}/10</div>
            <div className="text-xs text-muted-foreground">Goal: {target}/10</div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all duration-500`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>Progress: {Math.round(percentage)}%</span>
            <span>10</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface FamilyTimelineProps {
  events: Array<{
    date: string;
    title: string;
    description: string;
    impact: 'positive' | 'negative' | 'neutral';
    score?: number;
  }>;
}

export const FamilyTimeline: React.FC<FamilyTimelineProps> = ({ events }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>Family Journey Timeline</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index: number) => (
            <div key={index} className="flex items-start space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                event.impact === 'positive' ? 'bg-green-100 text-green-600' :
                event.impact === 'negative' ? 'bg-red-100 text-red-600' :
                'bg-muted text-muted-foreground'
              }`}>
                {event.impact === 'positive' ? '⭐' : 
                 event.impact === 'negative' ? '⚠️' : '📅'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">{event.title}</div>
                <div className="text-sm text-muted-foreground">{event.description}</div>
                <div className="text-xs text-muted-foreground mt-1">{event.date}</div>
                {event.score !== undefined && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Target className="w-3 h-3" />
                    <span className="text-xs text-muted-foreground">Score: {event.score}/10</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface FamilyInsightsCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  value?: string;
}

export const FamilyInsightsCard: React.FC<FamilyInsightsCardProps> = ({
  title,
  description,
  icon,
  color,
  value
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-xl bg-gradient-to-r ${color}`}>
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{description}</p>
            {value && (
              <div className="text-lg font-bold text-foreground">{value}</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};