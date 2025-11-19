import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FamilySocialFeatures } from "@/components/family/FamilySocialFeatures";
import type { FamilyMember } from "@/types/family";

interface SocialTabProps {
  familyMembers: FamilyMember[];
}

export const SocialTab: React.FC<SocialTabProps> = ({ familyMembers }) => {
  const [currentUserId, setCurrentUserId] = useState<string>("");

  useEffect(() => {
    // Get current user ID from localStorage or auth context
    const userId = localStorage.getItem("currentUserId") || familyMembers[0]?.id || "";
    setCurrentUserId(userId);
  }, [familyMembers]);

  return (
    <motion.div
      key="social"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <FamilySocialFeatures familyMembers={familyMembers} currentUserId={currentUserId} />
    </motion.div>
  );
};
