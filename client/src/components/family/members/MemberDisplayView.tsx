import React from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import { COMMUNICATION_STYLES } from "../constants/familyMemberConstants";

interface MemberDisplayViewProps {
  member: FamilyMember;
}

export const MemberDisplayView: React.FC<MemberDisplayViewProps> = ({ member }) => {
  return (
    <div className="space-y-3">
      {/* Communication Style */}
      <div>
        <Label className="text-xs font-medium text-gray-600">Communication Style</Label>
        <div className="mt-1">
          <Badge variant="secondary" className="text-xs">
            {COMMUNICATION_STYLES.find(s => s.value === member.communicationStyle)?.icon}{" "}
            {COMMUNICATION_STYLES.find(s => s.value === member.communicationStyle)?.label}
          </Badge>
        </div>
      </div>

      {/* Interests */}
      {member.interests.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-gray-600">Interests</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {member.interests.slice(0, 4).map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {member.interests.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{member.interests.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Personality Traits */}
      {member.personalityTraits.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-gray-600">Personality</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {member.personalityTraits.slice(0, 3).map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
            {member.personalityTraits.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{member.personalityTraits.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Privacy</span>
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3 text-gray-400" />
          <span className="capitalize text-gray-700">{member.preferences.privacy}</span>
        </div>
      </div>
    </div>
  );
};
