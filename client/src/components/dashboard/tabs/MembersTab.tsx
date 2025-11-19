import React from "react";
import { motion } from "framer-motion";
import { FamilyMemberProfiles } from "@/components/family/FamilyMemberProfiles";
import type { FamilyMember } from "@/types/family";

interface MembersTabProps {
  familyMembers: FamilyMember[];
  onMembersChange: (members: FamilyMember[]) => void;
  currentUserId?: string;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  familyMembers,
  onMembersChange,
  currentUserId,
}) => {
  return (
    <motion.div
      key="members"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <FamilyMemberProfiles
        members={familyMembers}
        onMembersChange={onMembersChange}
        currentUserId={currentUserId}
      />
    </motion.div>
  );
};
