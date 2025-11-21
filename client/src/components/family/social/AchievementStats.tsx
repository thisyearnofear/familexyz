import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Flame, Crown } from "lucide-react";
import { Achievement } from "./types";

interface AchievementStatsProps {
  achievements: Achievement[];
}

export const AchievementStats: React.FC<AchievementStatsProps> = ({ achievements }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm">
        <CardContent className="p-5 text-center">
          <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-yellow-700">{achievements.length}</div>
          <div className="text-sm text-yellow-700 font-semibold">Total Achievements</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-sm">
        <CardContent className="p-5 text-center">
          <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-purple-700">
            {achievements.reduce((sum, a) => sum + a.points, 0)}
          </div>
          <div className="text-sm text-purple-700 font-semibold">Total Points</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 shadow-sm">
        <CardContent className="p-5 text-center">
          <Flame className="w-8 h-8 text-orange-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-orange-700">7</div>
          <div className="text-sm text-orange-700 font-semibold">Day Streak</div>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm">
        <CardContent className="p-5 text-center">
          <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
          <div className="text-3xl font-bold text-yellow-700">
            {achievements.filter(a => a.rarity === "legendary").length}
          </div>
          <div className="text-sm text-yellow-700 font-semibold">Legendary</div>
        </CardContent>
      </Card>
    </div>
  );
};
