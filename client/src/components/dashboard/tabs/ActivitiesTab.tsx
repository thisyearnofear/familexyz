import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Heart,
  MessageCircle,
  Users,
  TrendingUp,
  ChevronDown,
  Clock,
  Zap,
  BookOpen,
  Gamepad2,
  Coffee,
  Utensils,
  Plus,
} from "lucide-react";
import type { FamilyMember } from "@/types/family";
import { AgentBadge, AskAgentButton } from "@/components/agents";

interface Activity {
  id: string;
  type: "connection" | "communication" | "bonding" | "growth" | "wellness" | "tradition";
  title: string;
  description: string;
  members: string[];
  timestamp: Date;
  duration?: number; // in minutes
  icon: React.ReactNode;
  color: string;
  impact: number; // 1-5 scale
  recommendedBy?: {
    agentId: string;
    agentName: string;
    agentEmoji: string;
    reason?: string;
  };
}

interface ActivitiesTabProps {
  familyMembers: FamilyMember[];
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ familyMembers }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  // Initialize sample activities
  useEffect(() => {
    const sampleActivities: Activity[] = [
      {
        id: "1",
        type: "bonding",
        title: "Family Game Night",
        description: "Enjoyed board games together for 2 hours",
        members: familyMembers.slice(0, 2).map(m => m.id),
        timestamp: new Date(Date.now() - 3600000),
        duration: 120,
        icon: <Gamepad2 className="w-5 h-5" />,
        color: "from-blue-50 to-blue-100 border-blue-200",
        impact: 5,
        recommendedBy: {
          agentId: "intimacy",
          agentName: "Intimacy",
          agentEmoji: "💖",
          reason: "Strengthens family bonds through playful interaction"
        }
      },
      {
        id: "2",
        type: "communication",
        title: "Morning Family Check-in",
        description: "Had a 30-minute conversation about everyone's day",
        members: familyMembers.map(m => m.id),
        timestamp: new Date(Date.now() - 7200000),
        duration: 30,
        icon: <MessageCircle className="w-5 h-5" />,
        color: "from-purple-50 to-purple-100 border-purple-200",
        impact: 4,
        recommendedBy: {
          agentId: "wisdom",
          agentName: "Wisdom",
          agentEmoji: "🧠",
          reason: "Promotes emotional clarity and understanding"
        }
      },
      {
        id: "3",
        type: "wellness",
        title: "Morning Walk Together",
        description: "45-minute walk in the park with family",
        members: familyMembers.slice(0, 2).map(m => m.id),
        timestamp: new Date(Date.now() - 14400000),
        duration: 45,
        icon: <Users className="w-5 h-5" />,
        color: "from-green-50 to-green-100 border-green-200",
        impact: 4,
        recommendedBy: {
          agentId: "presence",
          agentName: "Presence",
          agentEmoji: "🧘",
          reason: "Encourages mindfulness and quality time"
        }
      },
      {
        id: "4",
        type: "tradition",
        title: "Movie Night",
        description: "Watched a classic family film together",
        members: familyMembers.map(m => m.id),
        timestamp: new Date(Date.now() - 86400000),
        duration: 150,
        icon: <Coffee className="w-5 h-5" />,
        color: "from-amber-50 to-amber-100 border-amber-200",
        impact: 5,
        recommendedBy: {
          agentId: "bridge",
          agentName: "Bridge",
          agentEmoji: "👵👦",
          reason: "Creates shared memories across generations"
        }
      },
      {
        id: "5",
        type: "growth",
        title: "Shared Learning Moment",
        description: "Taught each other new skills and knowledge",
        members: familyMembers.slice(1, 3).map(m => m.id),
        timestamp: new Date(Date.now() - 172800000),
        duration: 60,
        icon: <BookOpen className="w-5 h-5" />,
        color: "from-rose-50 to-rose-100 border-rose-200",
        impact: 4,
        recommendedBy: {
          agentId: "growth",
          agentName: "Growth",
          agentEmoji: "🌱",
          reason: "Supports continuous family development"
        }
      },
      {
        id: "6",
        type: "connection",
        title: "Cooking Together",
        description: "Made family dinner as a team",
        members: familyMembers.slice(0, 3).map(m => m.id),
        timestamp: new Date(Date.now() - 259200000),
        duration: 90,
        icon: <Utensils className="w-5 h-5" />,
        color: "from-orange-50 to-orange-100 border-orange-200",
        impact: 5,
        recommendedBy: {
          agentId: "intimacy",
          agentName: "Intimacy",
          agentEmoji: "💖",
          reason: "Builds connection through collaboration"
        }
      },
    ];

    setActivities(sampleActivities);
  }, [familyMembers]);

  const filters = [
    { id: "all", label: "All Activities", color: "text-gray-700" },
    { id: "connection", label: "Connection", color: "text-cyan-600" },
    { id: "communication", label: "Communication", color: "text-purple-600" },
    { id: "bonding", label: "Bonding", color: "text-blue-600" },
    { id: "growth", label: "Growth", color: "text-rose-600" },
    { id: "wellness", label: "Wellness", color: "text-green-600" },
    { id: "tradition", label: "Tradition", color: "text-amber-600" },
  ];

  const filteredActivities =
    selectedFilter === "all"
      ? activities
      : activities.filter((a) => a.type === selectedFilter);

  const totalImpact = filteredActivities.reduce((sum, a) => sum + a.impact, 0);
  const avgImpact = filteredActivities.length > 0 ? (totalImpact / filteredActivities.length).toFixed(1) : 0;
  const totalDuration = filteredActivities.reduce((sum, a) => sum + (a.duration || 0), 0);

  const getMemberNames = (memberIds: string[]) => {
    return memberIds
      .map((id) => familyMembers.find((m) => m.id === id)?.name || "Unknown")
      .join(", ");
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      key="activities"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <span>Family Activities</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Track and celebrate your family's moments together
          </p>
        </div>
        <Button className="bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:shadow-lg active:shadow-inner text-white font-bold text-base py-3 px-6 rounded-lg shadow-md disabled:cursor-not-allowed transition-all">
          <Plus className="w-5 h-5 mr-2" />
          Log Activity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-semibold">Total Activities</p>
                <p className="text-3xl font-bold text-blue-800">{filteredActivities.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-semibold">Avg. Impact Score</p>
                <p className="text-3xl font-bold text-purple-800">{avgImpact}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold">Time Together</p>
                <p className="text-3xl font-bold text-green-800">{totalDuration}m</p>
              </div>
              <Clock className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`transition-all ${
              selectedFilter === filter.id
                ? "bg-white text-gray-900 border-2 border-purple-400 shadow-md font-semibold"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card
                  className={`bg-gradient-to-r ${activity.color} cursor-pointer hover:shadow-lg transition-all overflow-hidden`}
                  onClick={() =>
                    setExpandedActivity(
                      expandedActivity === activity.id ? null : activity.id
                    )
                  }
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <div className="p-3 bg-white bg-opacity-70 rounded-lg flex-shrink-0">
                          {activity.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center flex-wrap gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{activity.title}</h3>
                            <Badge className="bg-white bg-opacity-70 text-gray-800 text-xs font-semibold capitalize">
                              {activity.type}
                            </Badge>
                            {activity.recommendedBy && (
                              <AgentBadge
                                agentId={activity.recommendedBy.agentId}
                                agentName={activity.recommendedBy.agentName}
                                agentEmoji={activity.recommendedBy.agentEmoji}
                                size="sm"
                              />
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-700 font-medium">
                            <span className="flex items-center space-x-1">
                              <Users className="w-3.5 h-3.5" />
                              <span>{getMemberNames(activity.members)}</span>
                            </span>
                            {activity.duration && (
                              <span className="flex items-center space-x-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{activity.duration}m</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <Zap className="w-3.5 h-3.5" />
                              <span>{activity.impact}/5 impact</span>
                            </span>
                            <span className="text-gray-600">
                              {formatTimeAgo(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform ${
                          expandedActivity === activity.id ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {/* Expanded Details */}
                    <AnimatePresence>
                      {expandedActivity === activity.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-white border-opacity-40"
                        >
                          <div className="space-y-3">
                            {activity.recommendedBy && (
                              <div className="bg-white bg-opacity-60 p-3 rounded-lg">
                                <p className="text-sm text-gray-800 font-medium mb-2">
                                  <span className="text-purple-700 font-bold">{activity.recommendedBy.agentEmoji} {activity.recommendedBy.agentName}</span> recommends this because:
                                </p>
                                <p className="text-sm text-gray-700 italic">
                                  "{activity.recommendedBy.reason}"
                                </p>
                                <div className="mt-2">
                                  <AskAgentButton
                                    agentId={activity.recommendedBy.agentId}
                                    agentName={activity.recommendedBy.agentName}
                                    agentEmoji={activity.recommendedBy.agentEmoji}
                                    context="this activity"
                                  />
                                </div>
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-gray-800">
                                Impact Score
                              </span>
                              <div className="flex space-x-1">
                                {[...Array(5)].map((_, i) => (
                                  <Zap
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < activity.impact
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 font-medium">
                              This activity strengthens{" "}
                              <span className="font-bold">
                                {activity.type === "connection"
                                  ? "family connection"
                                  : activity.type === "communication"
                                  ? "communication"
                                  : activity.type === "bonding"
                                  ? "family bonding"
                                  : activity.type === "growth"
                                  ? "personal growth"
                                  : activity.type === "wellness"
                                  ? "wellness"
                                  : "family traditions"}
                              </span>
                              .
                            </p>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-md active:shadow-inner border border-gray-300 transition-all disabled:cursor-not-allowed"
                              >
                                <Heart className="w-5 h-5 mr-1.5" />
                                Like
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold py-2 px-4 rounded-lg shadow-sm hover:shadow-md active:shadow-inner border border-gray-300 transition-all disabled:cursor-not-allowed"
                              >
                                <MessageCircle className="w-5 h-5 mr-1.5" />
                                Comment
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No activities found with this filter</p>
              <Button className="bg-gradient-to-r from-purple-600 via-purple-600 to-pink-600 hover:shadow-lg active:shadow-inner text-white font-bold text-base py-3 px-6 rounded-lg shadow-md disabled:cursor-not-allowed transition-all">
                <Plus className="w-5 h-5 mr-2" />
                Log Your First Activity
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
