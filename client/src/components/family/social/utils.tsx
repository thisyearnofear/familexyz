import { Star, Award, Crown, Medal } from "lucide-react";
import { FamilyMember } from "./types";

export const getMemberName = (familyMembers: FamilyMember[], memberId: string) => {
  const member = familyMembers.find(m => m.id === memberId);
  return member?.name || "Family Member";
};

export const getMemberAvatar = (familyMembers: FamilyMember[], memberId: string) => {
  return familyMembers.find(m => m.id === memberId)?.avatar;
};

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
};

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case "common": return "text-gray-600 bg-gray-100";
    case "rare": return "text-blue-600 bg-blue-100";
    case "epic": return "text-purple-600 bg-purple-100";
    case "legendary": return "text-yellow-600 bg-yellow-100";
    default: return "text-gray-600 bg-gray-100";
  }
};

export const getRarityIcon = (rarity: string) => {
  switch (rarity) {
    case "common": return <Star className="w-3 h-3" />;
    case "rare": return <Award className="w-3 h-3" />;
    case "epic": return <Crown className="w-3 h-3" />;
    case "legendary": return <Medal className="w-3 h-3" />;
    default: return <Star className="w-3 h-3" />;
  }
};
