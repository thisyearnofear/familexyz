import React from "react";

/**
 * Social feature types - consolidated from components/family/social/types.ts
 */

export interface SocialFamilyMember {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
}

export interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "bonding" | "communication" | "growth" | "tradition" | "milestone";
  earnedBy: string[];
  earnedDate: Date;
  points: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  shareCount: number;
  likes: string[];
  comments: Comment[];
}

export interface FamilyChallenge {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  participants: string[];
  progress: { [memberId: string]: number };
  target: number;
  reward: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
}

export interface CreateChallengeData {
  title: string;
  description: string;
  category: string;
  duration: string;
  target: number;
  reward: string;
}

export interface FamilyPost {
  id: string;
  type: "achievement" | "milestone" | "memory" | "challenge" | "gratitude";
  author: string;
  content: string;
  media?: string[];
  timestamp: Date;
  likes: string[];
  comments: Comment[];
  tags: string[];
  privacy: "family" | "extended" | "public";
  agentReactions?: Array<{
    agentId: string;
    agentName: string;
    agentEmoji: string;
    reaction: string;
  }>;
}


