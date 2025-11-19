import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Target } from "lucide-react";
import type { FamilyMember } from "@/types/family";

interface ActivitiesTabProps {
  familyMembers: FamilyMember[];
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = () => {
  return (
    <motion.div
      key="activities"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Family Activities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Activity tracking coming soon...</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
