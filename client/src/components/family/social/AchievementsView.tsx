import React from "react";
import { motion } from "framer-motion";
import { Achievement, FamilyMember } from "./types";
import { AchievementStats } from "./AchievementStats";
import { AchievementCard } from "./AchievementCard";

interface AchievementsViewProps {
  achievements: Achievement[];
  currentUserId: string;
  familyMembers: FamilyMember[];
  onLike: (id: string) => void;
  onShare: (id: string) => void;
}

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  achievements,
  currentUserId,
  familyMembers,
  onLike,
  onShare
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <AchievementStats achievements={achievements} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            currentUserId={currentUserId}
            familyMembers={familyMembers}
            onLike={onLike}
            onShare={onShare}
          />
        ))}
      </div>
    </motion.div>
  );
};
