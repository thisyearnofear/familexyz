import { useState } from "react";
import { FamilyMetricsCards } from "@/components/family/FamilyMetricsCards";
import { FamilyLineChart } from "@/components/family/FamilyLineChart";
import { FamilyRadarChart } from "@/components/family/FamilyRadarChart";
import { useFamilyStats, useFamilyHistory } from "@/hooks/useFamilyData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Sparkles,
  Users,
  Calendar,
  Award,
  TrendingUp,
} from "lucide-react";

const FAMILY_AGENTS = [
  {
    id: "wisdom",
    name: "Sophia",
    emoji: "🧠",
    color: "from-purple-500 to-indigo-600",
    specialty: "Philosophy & Emotional Intelligence",
    tagline: "Guiding your family through life's big questions",
  },
  {
    id: "intimacy",
    name: "Amore",
    emoji: "💖",
    color: "from-pink-500 to-rose-600",
    specialty: "Relationship Coaching",
    tagline: "Deepening the bonds that matter most",
  },
  {
    id: "generational",
    name: "Legacy",
    emoji: "👨‍👩‍👧‍👦",
    color: "from-amber-500 to-orange-600",
    specialty: "Cross-generational Stories",
    tagline: "Bridging hearts across generations",
  },
  {
    id: "presence",
    name: "Zen",
    emoji: "🧘‍♀️",
    color: "from-green-500 to-emerald-600",
    specialty: "Mindfulness & Digital Wellness",
    tagline: "Finding peace in our connected world",
  },
  {
    id: "growth",
    name: "Bloom",
    emoji: "🌱",
    color: "from-blue-500 to-cyan-600",
    specialty: "Family Growth Challenges",
    tagline: "Growing stronger together, one step at a time",
  },
];

const RECENT_MILESTONES = [
  {
    id: 1,
    title: "Seven Days of Peaceful Dinners",
    description:
      "Your family celebrated a full week of device-free dinners together",
    date: "2 hours ago",
    type: "presence",
    celebration: "🎉",
  },
  {
    id: 2,
    title: "Conflict Resolved with Love",
    description:
      "Sarah and Mom worked through their disagreement with empathy and understanding",
    date: "Yesterday",
    type: "wisdom",
    celebration: "💝",
  },
  {
    id: 3,
    title: "Grandpa's Story Preserved",
    description: "The family recorded Grandpa's story about his first job",
    date: "3 days ago",
    type: "generational",
    celebration: "📚",
  },
];

const FamilyAgentCard = ({ agent }: { agent: (typeof FAMILY_AGENTS)[0] }) => (
  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer">
    <CardHeader className="pb-3">
      <div
        className={`w-16 h-16 rounded-full bg-gradient-to-br ${agent.color} flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}
      >
        {agent.emoji}
      </div>
      <div>
        <CardTitle className="text-xl font-semibold text-gray-800">
          {agent.name}
        </CardTitle>
        <p className="text-sm text-gray-600 font-medium">{agent.specialty}</p>
        <p className="text-xs text-gray-500 mt-1 italic">{agent.tagline}</p>
      </div>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <Badge
          variant="secondary"
          className="bg-green-50 text-green-700 border-green-200"
        >
          Active Today
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          Chat →
        </Button>
      </div>
    </CardContent>
  </Card>
);

const MilestoneCard = ({
  milestone,
}: {
  milestone: (typeof RECENT_MILESTONES)[0];
}) => (
  <div className="flex items-start space-x-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
    <div className="text-2xl">{milestone.celebration}</div>
    <div className="flex-1 min-w-0">
      <h4 className="font-semibold text-gray-800 text-sm">{milestone.title}</h4>
      <p className="text-gray-600 text-xs mt-1 line-clamp-2">
        {milestone.description}
      </p>
      <p className="text-gray-500 text-xs mt-2">{milestone.date}</p>
    </div>
    <Badge variant="outline" className="text-xs">
      {FAMILY_AGENTS.find((a) => a.id === milestone.type)?.name}
    </Badge>
  </div>
);

const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  action,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  action: string;
  color: string;
}) => (
  <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer">
    <CardContent className="p-6">
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-gray-700 hover:text-gray-900"
      >
        {action} →
      </Button>
    </CardContent>
  </Card>
);

export default function FamilyHome() {
  const [activeTab, setActiveTab] = useState("overview");
  const { data: familyStats, isLoading: statsLoading } = useFamilyStats();
  const { data: familyHistory, isLoading: historyLoading } = useFamilyHistory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Beautiful Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Family Connection Hub
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Where love grows stronger, bonds deepen, and every moment becomes a
            memory worth cherishing
          </p>
        </div>

        {/* Family Health Overview */}
        <FamilyMetricsCards stats={familyStats} isLoading={statsLoading} />

        {/* Main Content Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 lg:w-fit lg:grid-cols-4 mx-auto">
            <TabsTrigger
              value="overview"
              className="flex items-center space-x-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Home</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>AI Family</span>
            </TabsTrigger>
            <TabsTrigger
              value="moments"
              className="flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Moments</span>
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Growth</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <QuickActionCard
                icon={Heart}
                title="Check In with Family"
                description="See how everyone is feeling today"
                action="Start Check-in"
                color="from-pink-500 to-rose-600"
              />
              <QuickActionCard
                icon={Users}
                title="Plan Family Time"
                description="Get personalized activity suggestions"
                action="Get Ideas"
                color="from-blue-500 to-cyan-600"
              />
              <QuickActionCard
                icon={Award}
                title="Celebrate Achievements"
                description="Acknowledge your family's recent wins"
                action="Celebrate"
                color="from-amber-500 to-orange-600"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span>Your Family's Journey</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FamilyLineChart
                    history={familyHistory}
                    isLoading={historyLoading}
                  />
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>Connection Balance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FamilyRadarChart
                    stats={familyStats}
                    isLoading={statsLoading}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Recent Milestones */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span>Recent Family Milestones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RECENT_MILESTONES.map((milestone) => (
                    <MilestoneCard key={milestone.id} milestone={milestone} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents" className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Your AI Family Team
              </h2>
              <p className="text-gray-600">
                Meet the caring AI companions dedicated to your family's
                happiness and growth
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FAMILY_AGENTS.map((agent) => (
                <FamilyAgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="moments" className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Precious Family Moments
              </h2>
              <p className="text-gray-600">
                Every conversation, every breakthrough, every laugh - captured
                and celebrated
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Today's Highlights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-xl">😊</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Family expressed gratitude during dinner
                        </p>
                        <p className="text-xs text-gray-600">6:30 PM</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-xl">🎯</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          Completed weekly family challenge
                        </p>
                        <p className="text-xs text-gray-600">3:15 PM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Weekly Wins</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        day: "Monday",
                        activity: "Shared childhood memories",
                        emoji: "📚",
                      },
                      {
                        day: "Wednesday",
                        activity: "Resolved sibling conflict peacefully",
                        emoji: "🤝",
                      },
                      {
                        day: "Friday",
                        activity: "Enjoyed screen-free family game night",
                        emoji: "🎲",
                      },
                    ].map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-xl">{item.emoji}</div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {item.activity}
                          </p>
                          <p className="text-xs text-gray-600">{item.day}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold text-gray-800">
                Growing Together
              </h2>
              <p className="text-gray-600">
                Track your family's journey of connection, understanding, and
                love
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">Communication</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    87%
                  </div>
                  <p className="text-gray-600 text-sm">
                    Family members feel heard and understood
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: "87%" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">
                    Emotional Bonding
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-pink-600 mb-2">
                    92%
                  </div>
                  <p className="text-gray-600 text-sm">
                    Moments of genuine connection and love
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full"
                      style={{ width: "92%" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-center">
                    Mindful Presence
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    78%
                  </div>
                  <p className="text-gray-600 text-sm">
                    Quality time without digital distractions
                  </p>
                  <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "78%" }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
