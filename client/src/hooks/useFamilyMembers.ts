import { useState, useEffect } from "react";
import type { FamilyMember } from "@/types/family";

/**
 * Custom hook to manage family members state
 * Handles initialization, onboarding, and member management
 */
export const useFamilyMembers = () => {
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentUserId] = useState("user-1"); // This would come from auth context

  // Check if user needs onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem("familyOnboardingCompleted");
    if (!hasCompletedOnboarding && familyMembers.length === 0) {
      setShowOnboarding(true);
    }
  }, [familyMembers]);

  // Initialize sample family data
  useEffect(() => {
    const sampleMembers: FamilyMember[] = [
      {
        id: "user-1",
        name: "Alex Johnson",
        relationship: "Parent",
        age: 42,
        interests: ["Reading", "Cooking", "Technology"],
        favoriteActivities: ["Family dinners", "Reading together"],
        communicationStyle: "visual",
        personalityTraits: ["Organized", "Empathetic", "Creative"],
        goals: ["Improve family communication", "Spend quality time"],
        preferences: {
          notifications: true,
          privacy: "moderate",
          shareProgress: true,
        },
      },
      {
        id: "user-2",
        name: "Sam Johnson",
        relationship: "Child",
        age: 12,
        interests: ["Gaming", "Art", "Music"],
        favoriteActivities: ["Playing games", "Drawing"],
        communicationStyle: "kinesthetic",
        personalityTraits: ["Creative", "Energetic", "Curious"],
        goals: ["Learn new skills", "Make friends"],
        preferences: {
          notifications: true,
          privacy: "moderate",
          shareProgress: true,
        },
      },
      {
        id: "user-3",
        name: "Jordan Johnson",
        relationship: "Teen",
        age: 16,
        interests: ["Sports", "Photography", "Movies"],
        favoriteActivities: ["Basketball", "Photography walks"],
        communicationStyle: "auditory",
        personalityTraits: ["Social", "Adventurous", "Independent"],
        goals: ["Build independence", "Explore creativity"],
        preferences: {
          notifications: false,
          privacy: "private",
          shareProgress: false,
        },
      },
    ];

    setFamilyMembers(sampleMembers);
  }, []);

  const handleOnboardingComplete = (profile: any) => {
    // Process onboarding data
    const newMembers: FamilyMember[] = profile.members.map(
      (member: any, index: number) => ({
        id: `user-${index + 1}`,
        name: member.name,
        relationship: member.relationship,
        age: member.age,
        interests: member.interests || [],
        favoriteActivities: member.favoriteActivities || [],
        communicationStyle: member.communicationStyle || "visual",
        personalityTraits: member.personalityTraits || [],
        goals: member.goals || [],
        preferences: {
          notifications: true,
          privacy: "moderate",
          shareProgress: true,
        },
      })
    );

    setFamilyMembers(newMembers);
    localStorage.setItem("familyOnboardingCompleted", "true");
    localStorage.setItem("familyProfile", JSON.stringify(profile));
    setShowOnboarding(false);
  };

  return {
    familyMembers,
    setFamilyMembers,
    showOnboarding,
    setShowOnboarding,
    currentUserId,
    handleOnboardingComplete,
  };
};
