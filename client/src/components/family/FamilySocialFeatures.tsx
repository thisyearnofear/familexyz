import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Trophy,
  MessageCircle,
  Camera,
  Users,
  Target,
  Home,
  Gamepad2,
  BookOpen
} from "lucide-react";
import {
  FamilyMember,
  Achievement,
  FamilyChallenge,
  FamilyPost,
  CreateChallengeData
} from "./social/types";
import { SocialFeed } from "./social/SocialFeed";
import { AchievementsView } from "./social/AchievementsView";
import { ChallengesView } from "./social/ChallengesView";
import { MemoriesView } from "./social/MemoriesView";

interface FamilySocialFeaturesProps {
  familyMembers: FamilyMember[];
  currentUserId: string;
}

export const FamilySocialFeatures: React.FC<FamilySocialFeaturesProps> = ({
  familyMembers,
  currentUserId: initialUserId
}) => {
  // Ensure currentUserId is set to a valid family member
  const validUserId = initialUserId && familyMembers.some(m => m.id === initialUserId)
    ? initialUserId
    : familyMembers[0]?.id || "user-1";

  const [activeTab, setActiveTab] = useState<"feed" | "achievements" | "challenges" | "memories">("feed");
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [challenges, setChallenges] = useState<FamilyChallenge[]>([]);
  const [posts, setPosts] = useState<FamilyPost[]>([]);
  const currentUserId = validUserId;

  // Initialize sample data
  useEffect(() => {
    initializeSampleData();
  }, []);

  const initializeSampleData = () => {
    // Sample achievements
    const sampleAchievements: Achievement[] = [
      {
        id: "1",
        title: "First Family Game Night",
        description: "Completed your first family game night together",
        icon: <Gamepad2 className="w-6 h-6" />,
        category: "bonding",
        earnedBy: familyMembers.map(m => m.id),
        earnedDate: new Date(Date.now() - 86400000),
        points: 100,
        rarity: "common",
        shareCount: 3,
        likes: [familyMembers[0]?.id, familyMembers[1]?.id].filter(Boolean),
        comments: [
          {
            id: "agent-1",
            author: "AI-Intimacy",
            content: "🎉 Amazing! Game nights create lasting memories and strengthen family bonds. I'm so proud of you all!",
            timestamp: new Date(Date.now() - 86300000),
            likes: familyMembers.map(m => m.id)
          }
        ]
      },
      {
        id: "2",
        title: "Communication Champion",
        description: "Completed 7 days of daily family check-ins",
        icon: <MessageCircle className="w-6 h-6" />,
        category: "communication",
        earnedBy: [familyMembers[0]?.id].filter(Boolean),
        earnedDate: new Date(Date.now() - 172800000),
        points: 250,
        rarity: "rare",
        shareCount: 1,
        likes: [],
        comments: [
          {
            id: "agent-2",
            author: "AI-Wisdom",
            content: "💫 Incredible consistency! Daily check-ins build emotional intelligence and family understanding. This is a huge milestone!",
            timestamp: new Date(Date.now() - 172700000),
            likes: familyMembers.map(m => m.id)
          }
        ]
      },
      {
        id: "3",
        title: "Memory Keeper",
        description: "Shared 5 family stories across generations",
        icon: <BookOpen className="w-6 h-6" />,
        category: "tradition",
        earnedBy: familyMembers.slice(0, 2).map(m => m.id),
        earnedDate: new Date(Date.now() - 259200000),
        points: 200,
        rarity: "epic",
        shareCount: 5,
        likes: familyMembers.map(m => m.id),
        comments: [
          {
            id: "agent-3",
            author: "AI-Bridge",
            content: "🌟 This is beautiful! Sharing stories across generations strengthens family identity and creates lasting connections. You're building a legacy!",
            timestamp: new Date(Date.now() - 259100000),
            likes: familyMembers.map(m => m.id)
          }
        ]
      }
    ];

    // Sample challenges
    const sampleChallenges: FamilyChallenge[] = [
      {
        id: "1",
        title: "30-Day Gratitude Challenge",
        description: "Share one thing you're grateful for each day as a family",
        category: "Mindfulness",
        duration: "30 days",
        participants: familyMembers.map(m => m.id),
        progress: familyMembers.reduce((acc, member) => {
          acc[member.id] = Math.floor(Math.random() * 15) + 5;
          return acc;
        }, {} as { [key: string]: number }),
        target: 30,
        reward: "Family Movie Night + Popcorn Bar",
        startDate: new Date(Date.now() - 604800000),
        endDate: new Date(Date.now() + 1814400000),
        isActive: true,
        createdBy: familyMembers[0]?.id || ""
      },
      {
        id: "2",
        title: "Device-Free Dinner Week",
        description: "Enjoy 7 consecutive device-free family dinners",
        category: "Presence",
        duration: "7 days",
        participants: familyMembers.map(m => m.id),
        progress: familyMembers.reduce((acc, member) => {
          acc[member.id] = Math.floor(Math.random() * 5) + 2;
          return acc;
        }, {} as { [key: string]: number }),
        target: 7,
        reward: "Family Game Tournament",
        startDate: new Date(Date.now() - 259200000),
        endDate: new Date(Date.now() + 345600000),
        isActive: true,
        createdBy: familyMembers[1]?.id || ""
      }
    ];

    // Sample posts
    const samplePosts: FamilyPost[] = [
      {
        id: "1",
        type: "achievement",
        author: familyMembers[0]?.id || "",
        content: "We just earned our first 'Family Game Night' achievement! 🎮 Such a fun evening playing board games together. The kids taught us some new strategies!",
        timestamp: new Date(Date.now() - 86400000),
        likes: familyMembers.slice(1).map(m => m.id),
        comments: [
          {
            id: "1",
            author: familyMembers[1]?.id || "",
            content: "That was so much fun! Can we do it again this weekend?",
            timestamp: new Date(Date.now() - 82800000),
            likes: [familyMembers[0]?.id].filter(Boolean)
          }
        ],
        tags: ["family-time", "games", "achievement"],
        privacy: "family",
        agentReactions: [
          {
            agentId: "intimacy",
            agentName: "Intimacy",
            agentEmoji: "💖",
            reaction: "Incredible bonding moment!"
          },
          {
            agentId: "wisdom",
            agentName: "Wisdom",
            agentEmoji: "🧠",
            reaction: "Learning together strengthens connections"
          }
        ]
      },
      {
        id: "2",
        type: "gratitude",
        author: familyMembers[1]?.id || "",
        content: "Today I'm grateful for our morning walks together. It's become my favorite part of the day! 🌅",
        timestamp: new Date(Date.now() - 172800000),
        likes: familyMembers.filter(m => m.id !== familyMembers[1]?.id).map(m => m.id),
        comments: [],
        tags: ["gratitude", "morning-walks", "family-time"],
        privacy: "family",
        agentReactions: [
          {
            agentId: "presence",
            agentName: "Presence",
            agentEmoji: "🧘",
            reaction: "Beautiful mindful practice!"
          },
          {
            agentId: "growth",
            agentName: "Growth",
            agentEmoji: "🌱",
            reaction: "Consistency builds lasting habits"
          }
        ]
      }
    ];

    setAchievements(sampleAchievements);
    setChallenges(sampleChallenges);
    setPosts(samplePosts);
  };

  const handleCreatePost = (content: string) => {
    const post: FamilyPost = {
      id: Date.now().toString(),
      type: "memory",
      author: currentUserId,
      content: content,
      timestamp: new Date(),
      likes: [],
      comments: [],
      tags: [],
      privacy: "family"
    };
    setPosts([post, ...posts]);
  };

  const likePost = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const likes = post.likes.includes(currentUserId)
          ? post.likes.filter(id => id !== currentUserId)
          : [...post.likes, currentUserId];
        return { ...post, likes };
      }
      return post;
    }));
  };

  const likeAchievement = (achievementId: string) => {
    setAchievements(achievements.map(achievement => {
      if (achievement.id === achievementId) {
        const likes = achievement.likes.includes(currentUserId)
          ? achievement.likes.filter(id => id !== currentUserId)
          : [...achievement.likes, currentUserId];
        return { ...achievement, likes };
      }
      return achievement;
    }));
  };

  const shareAchievement = (achievementId: string) => {
    setAchievements(achievements.map(achievement => {
      if (achievement.id === achievementId) {
        return { ...achievement, shareCount: achievement.shareCount + 1 };
      }
      return achievement;
    }));

    // Create a post about the shared achievement
    const achievement = achievements.find(a => a.id === achievementId);
    if (achievement) {
      const sharePost: FamilyPost = {
        id: Date.now().toString(),
        type: "achievement",
        author: currentUserId,
        content: `Just earned the "${achievement.title}" achievement! ${achievement.description} 🏆`,
        timestamp: new Date(),
        likes: [],
        comments: [],
        tags: ["achievement", achievement.category],
        privacy: "family"
      };
      setPosts([sharePost, ...posts]);
    }
  };

  const handleCreateChallenge = (data: CreateChallengeData) => {
    const challenge: FamilyChallenge = {
      id: Date.now().toString(),
      title: data.title,
      description: data.description,
      category: data.category || "bonding",
      duration: data.duration ? `${data.duration} days` : "7 days",
      participants: [currentUserId],
      progress: { [currentUserId]: 0 },
      target: data.target || 7,
      reward: data.reward || "Family Glory",
      startDate: new Date(),
      endDate: new Date(Date.now() + (parseInt(data.duration || "7") * 86400000)),
      isActive: true,
      createdBy: currentUserId
    };

    setChallenges([challenge, ...challenges]);
  };

  const tabs = [
    { id: "feed", label: "Family Feed", icon: Home },
    { id: "achievements", label: "Achievements", icon: Trophy },
    { id: "challenges", label: "Challenges", icon: Target },
    { id: "memories", label: "Memories", icon: Camera }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Family Social Hub</span>
          </h2>
          <p className="text-muted-foreground mt-1">
            Share achievements, collaborate on challenges, and celebrate your family journey
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg border border-purple-500/20">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-card text-purple-700 shadow-md border-2 border-purple-300"
                  : "text-foreground hover:text-purple-700 hover:bg-card hover:bg-opacity-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "feed" && (
          <SocialFeed
            key="feed"
            posts={posts}
            currentUserId={currentUserId}
            familyMembers={familyMembers}
            onCreatePost={handleCreatePost}
            onLikePost={likePost}
          />
        )}

        {activeTab === "achievements" && (
          <AchievementsView
            key="achievements"
            achievements={achievements}
            currentUserId={currentUserId}
            familyMembers={familyMembers}
            onLike={likeAchievement}
            onShare={shareAchievement}
          />
        )}

        {activeTab === "challenges" && (
          <ChallengesView
            key="challenges"
            challenges={challenges}
            familyMembers={familyMembers}
            onCreateChallenge={handleCreateChallenge}
          />
        )}

        {activeTab === "memories" && (
          <MemoriesView key="memories" />
        )}
      </AnimatePresence>
    </div>
  );
};