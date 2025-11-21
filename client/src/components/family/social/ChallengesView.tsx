import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { FamilyChallenge, FamilyMember, CreateChallengeData } from "./types";
import { ChallengeCard } from "./ChallengeCard";
import { CreateChallengeModal } from "./CreateChallengeModal";

interface ChallengesViewProps {
  challenges: FamilyChallenge[];
  familyMembers: FamilyMember[];
  onCreateChallenge: (data: CreateChallengeData) => void;
}

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  challenges,
  familyMembers,
  onCreateChallenge
}) => {
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);

  const handleCreate = (data: CreateChallengeData) => {
    onCreateChallenge(data);
    setShowCreateChallenge(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Create Challenge Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Active Challenges</h3>
        <Button
          onClick={() => setShowCreateChallenge(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Challenge
        </Button>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {challenges.filter(c => c.isActive).map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            familyMembers={familyMembers}
          />
        ))}
      </div>

      <CreateChallengeModal
        isOpen={showCreateChallenge}
        onClose={() => setShowCreateChallenge(false)}
        onCreate={handleCreate}
      />
    </motion.div>
  );
};
