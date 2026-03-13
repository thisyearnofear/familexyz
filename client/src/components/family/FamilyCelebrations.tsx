import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Star,
  Trophy,
  Sparkles,
  Calendar,
  Users,
  Award,
  PartyPopper,
  Coins,
  TrendingUp,
} from "lucide-react";

const RECENT_CELEBRATIONS = [
  {
    id: 1,
    title: "Seven Days of Harmony",
    description:
      "Your family celebrated a full week of peaceful conversations and mutual understanding",
    type: "milestone",
    date: "Just now",
    reward: 0.05,
    celebration: "🎉",
    color: "from-purple-500 to-pink-500",
    participants: ["Mom", "Dad", "Sarah", "Jake"],
  },
  {
    id: 2,
    title: "Empathy Champion",
    description:
      "Sarah showed exceptional understanding during a family discussion",
    type: "individual",
    date: "2 hours ago",
    reward: 0.01,
    celebration: "💝",
    color: "from-blue-500 to-cyan-500",
    participants: ["Sarah"],
  },
  {
    id: 3,
    title: "Story Keeper",
    description:
      "The family preserved Grandpa's beautiful story about his childhood",
    type: "legacy",
    date: "Yesterday",
    reward: 0.02,
    celebration: "📚",
    color: "from-amber-500 to-orange-500",
    participants: ["Whole Family"],
  },
  {
    id: 4,
    title: "Mindful Moment Masters",
    description:
      "Completed your first week of device-free dinner conversations",
    type: "presence",
    date: "2 days ago",
    reward: 0.03,
    celebration: "🧘‍♀️",
    color: "from-green-500 to-emerald-500",
    participants: ["Mom", "Dad", "Sarah", "Jake"],
  },
];

const ACHIEVEMENT_BADGES = [
  {
    id: "communicator",
    name: "Great Communicator",
    icon: "💬",
    level: 3,
    progress: 85,
  },
  {
    id: "peacemaker",
    name: "Family Peacemaker",
    icon: "🕊️",
    level: 2,
    progress: 60,
  },
  {
    id: "storyteller",
    name: "Memory Keeper",
    icon: "📖",
    level: 4,
    progress: 95,
  },
  {
    id: "mindful",
    name: "Mindful Presence",
    icon: "🧘",
    level: 2,
    progress: 40,
  },
  { id: "growth", name: "Growth Champion", icon: "🌱", level: 1, progress: 25 },
];

const UPCOMING_CELEBRATIONS = [
  {
    title: "Monthly Family Reflection",
    description: "Celebrate your family's growth over the past month",
    daysUntil: 3,
    potentialReward: 0.1,
    icon: "🎊",
  },
  {
    title: "Generational Bridge Builder",
    description: "5 more stories shared to unlock this special achievement",
    progress: 7,
    total: 12,
    potentialReward: 0.15,
    icon: "🌉",
  },
];

const CelebrationCard = ({
  celebration,
}: {
  celebration: (typeof RECENT_CELEBRATIONS)[0];
}) => (
  <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
    <div className={`h-2 bg-gradient-to-r ${celebration.color}`} />
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl animate-bounce">
            {celebration.celebration}
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground group-hover:text-foreground">
              {celebration.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {celebration.description}
            </p>
          </div>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-500/10 text-green-700 border-green-500/20"
        >
          New!
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Users className="w-4 h-4" />
            <span>{celebration.participants.join(", ")}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>{celebration.date}</span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm font-medium text-blue-600">
            <Coins className="w-4 h-4" />
            <span>ℏ{celebration.reward}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-purple-600 hover:text-purple-700"
          >
            Celebrate →
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const BadgeCard = ({ badge }: { badge: (typeof ACHIEVEMENT_BADGES)[0] }) => (
  <Card className="text-center hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="text-4xl mb-3">{badge.icon}</div>
      <h3 className="font-semibold text-foreground mb-2">{badge.name}</h3>
      <div className="flex items-center justify-center space-x-1 mb-3">
        <Star className="w-4 h-4 text-yellow-500" />
        <span className="text-sm font-medium text-muted-foreground">
          Level {badge.level}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 mb-2">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${badge.progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {badge.progress}% to Level {badge.level + 1}
      </p>
    </CardContent>
  </Card>
);

const UpcomingCard = ({
  upcoming,
}: {
  upcoming: (typeof UPCOMING_CELEBRATIONS)[0];
}) => (
  <Card className="border-dashed border-2 border-purple-500/20 bg-purple-500/10">
    <CardContent className="p-6">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{upcoming.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{upcoming.title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{upcoming.description}</p>

          {upcoming.daysUntil && (
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {upcoming.daysUntil} days to go
              </Badge>
              <div className="flex items-center space-x-1 text-sm text-purple-600">
                <Gift className="w-4 h-4" />
                <span>ℏ{upcoming.potentialReward}</span>
              </div>
            </div>
          )}

          {upcoming.progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {upcoming.progress}/{upcoming.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                  style={{
                    width: `${(upcoming.progress / upcoming.total) * 100}%`,
                  }}
                />
              </div>
              <div className="flex items-center space-x-1 text-sm text-purple-600">
                <Gift className="w-4 h-4" />
                <span>ℏ{upcoming.potentialReward} when complete</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const HBARBalanceCard = () => (
  <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-blue-100 text-sm font-medium">
            Family HBAR Balance
          </p>
          <div className="flex items-center space-x-2 mt-1">
            <Coins className="w-6 h-6" />
            <span className="text-3xl font-bold">ℏ0.247</span>
          </div>
          <p className="text-blue-100 text-xs mt-1">≈ $0.02 USD</p>
        </div>
        <div className="text-right">
          <div className="flex items-center space-x-1 text-green-300">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">+0.05 this week</span>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 mt-2"
            size="sm"
          >
            View History
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function FamilyCelebrations() {
  const [activeTab, setActiveTab] = useState("recent");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <PartyPopper className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Family Celebrations
          </h1>
        </div>
        <p className="text-muted-foreground">
          Every moment of growth, every act of love, every step forward together
          - celebrated and remembered
        </p>
      </div>

      {/* HBAR Balance */}
      <HBARBalanceCard />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Recent Wins</span>
          </TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center space-x-2">
            <Award className="w-4 h-4" />
            <span>Achievements</span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="flex items-center space-x-2">
            <Gift className="w-4 h-4" />
            <span>Coming Up</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recent" className="space-y-4">
          <div className="space-y-4">
            {RECENT_CELEBRATIONS.map((celebration) => (
              <CelebrationCard key={celebration.id} celebration={celebration} />
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" className="text-muted-foreground">
              View All Celebrations
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Family Achievement Badges
            </h2>
            <p className="text-muted-foreground">
              Recognition for your family's growth in different areas
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ACHIEVEMENT_BADGES.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Exciting Things Ahead
            </h2>
            <p className="text-muted-foreground">
              Upcoming milestones and celebrations to look forward to
            </p>
          </div>

          <div className="space-y-4">
            {UPCOMING_CELEBRATIONS.map((upcoming, index: number) => (
              <UpcomingCard key={index} upcoming={upcoming} />
            ))}
          </div>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-6 text-center">
              <Trophy className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                Create Your Own Celebration
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Set a family goal and celebrate when you achieve it together
              </p>
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
                Set Family Goal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fun Footer */}
      <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
        <p className="text-sm text-muted-foreground mb-2">
          🌟 Every HBAR earned represents a moment of love, growth, or
          connection in your family
        </p>
        <p className="text-xs text-muted-foreground">
          These micro-rewards are just tokens of celebration - the real reward
          is the stronger family you're building together
        </p>
      </div>
    </div>
  );
}
