import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Heart, Share2 } from "lucide-react";
import { Achievement, FamilyMember } from "./types";
import { getMemberName, getMemberAvatar, formatTimeAgo, getRarityColor, getRarityIcon } from "./utils";

interface AchievementCardProps {
  achievement: Achievement;
  currentUserId: string;
  familyMembers: FamilyMember[];
  onLike: (id: string) => void;
  onShare: (id: string) => void;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  currentUserId,
  familyMembers,
  onLike,
  onShare
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 cursor-pointer hover:shadow-lg transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-purple-300 to-pink-300 rounded-lg shadow-sm">
                {achievement.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                <Badge className={`text-xs font-semibold ${getRarityColor(achievement.rarity)}`}>
                  {getRarityIcon(achievement.rarity)}
                  <span className="ml-1 capitalize">{achievement.rarity}</span>
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-amber-700">+{achievement.points}</div>
              <div className="text-xs text-amber-700 font-semibold">points</div>
            </div>
          </div>

          <p className="text-sm text-gray-800 mb-3 font-medium">{achievement.description}</p>

          <div className="flex items-center justify-between text-xs text-gray-700 mb-3 font-medium">
            <span>Earned {formatTimeAgo(achievement.earnedDate)}</span>
            <span>{achievement.earnedBy.length} member(s)</span>
          </div>

          {/* Earned by avatars */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {achievement.earnedBy.slice(0, 3).map((memberId, idx) => (
                <Avatar key={idx} className="w-6 h-6 border-2 border-white bg-gradient-to-r from-blue-400 to-purple-400">
                  {getMemberAvatar(familyMembers, memberId) ? (
                    <img src={getMemberAvatar(familyMembers, memberId)} alt={getMemberName(familyMembers, memberId)} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-semibold">
                      {getMemberName(familyMembers, memberId).charAt(0)}
                    </span>
                  )}
                </Avatar>
              ))}
              {achievement.earnedBy.length > 3 && (
                <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600">+{achievement.earnedBy.length - 3}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onLike(achievement.id)}
                className={`flex items-center space-x-1 text-xs transition-colors ${
                  achievement.likes.includes(currentUserId)
                    ? "text-red-600"
                    : "text-gray-500 hover:text-red-600"
                }`}
              >
                <Heart className={`w-3 h-3 ${achievement.likes.includes(currentUserId) ? "fill-current" : ""}`} />
                <span>{achievement.likes.length}</span>
              </button>
              <button
                onClick={() => onShare(achievement.id)}
                className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Share2 className="w-3 h-3" />
                <span>{achievement.shareCount}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
