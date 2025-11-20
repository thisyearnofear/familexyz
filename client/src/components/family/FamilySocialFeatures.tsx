import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  Share2,
  Trophy,
  Heart,
  MessageCircle,
  Camera,
  Gift,
  Star,
  Users,
  Calendar,
  Target,
  Zap,
  Award,
  Smile,
  ThumbsUp,
  Send,
  Plus,
  Clock,
  CheckCircle,
  Sparkles,
  Crown,
  Medal,
  Flame,
  TrendingUp,
  BookOpen,
  Music,
  Gamepad2,
  Home,
  Baby,
  Leaf,
  Brain,
  Eye,
  Lock,
  Globe
} from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  avatar?: string;
  relationship: string;
}

interface Achievement {
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

interface FamilyChallenge {
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

interface FamilyPost {
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
}

interface Comment {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: string[];
}

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
  const [newPost, setNewPost] = useState("");
  const [showCreateChallenge, setShowCreateChallenge] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
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
        comments: []
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
        comments: []
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
        comments: []
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
        privacy: "family"
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
        privacy: "family"
      }
    ];

    setAchievements(sampleAchievements);
    setChallenges(sampleChallenges);
    setPosts(samplePosts);
  };

  const createPost = () => {
    if (newPost.trim()) {
      const post: FamilyPost = {
        id: Date.now().toString(),
        type: "memory",
        author: currentUserId,
        content: newPost,
        timestamp: new Date(),
        likes: [],
        comments: [],
        tags: [],
        privacy: "family"
      };
      setPosts([post, ...posts]);
      setNewPost("");
    }
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

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "text-gray-600 bg-gray-100";
      case "rare": return "text-blue-600 bg-blue-100";
      case "epic": return "text-purple-600 bg-purple-100";
      case "legendary": return "text-yellow-600 bg-yellow-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case "common": return <Star className="w-3 h-3" />;
      case "rare": return <Award className="w-3 h-3" />;
      case "epic": return <Crown className="w-3 h-3" />;
      case "legendary": return <Medal className="w-3 h-3" />;
      default: return <Star className="w-3 h-3" />;
    }
  };

  const getMemberName = (memberId: string) => {
    const member = familyMembers.find(m => m.id === memberId);
    return member?.name || "Family Member";
  };

  const getMemberAvatar = (memberId: string) => {
    return familyMembers.find(m => m.id === memberId)?.avatar;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
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
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Family Social Hub</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Share achievements, collaborate on challenges, and celebrate your family journey
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 bg-gradient-to-r from-purple-50 to-pink-50 p-2 rounded-lg border border-purple-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? "bg-white text-purple-700 shadow-md border-2 border-purple-300"
                  : "text-gray-700 hover:text-purple-700 hover:bg-white hover:bg-opacity-50"
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
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Create Post */}
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm">
              <CardContent className="p-5">
                <div className="flex space-x-4">
                  <Avatar className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 flex-shrink-0 border-2 border-white shadow-sm">
                    {getMemberAvatar(currentUserId) ? (
                      <img src={getMemberAvatar(currentUserId)} alt="You" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">
                        {getMemberName(currentUserId).charAt(0) || "U"}
                      </span>
                    )}
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Posting as {getMemberName(currentUserId) || "Family Member"}
                      </p>
                      <Textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="Share a family moment, achievement, or thought..."
                        rows={3}
                        className="border-purple-200 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm"
                          className="bg-white border-2 border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold"
                        >
                          <Camera className="w-4 h-4 mr-2" />
                          Photo
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-white border-2 border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold"
                        >
                          <Trophy className="w-4 h-4 mr-2" />
                          Achievement
                        </Button>
                      </div>
                      <Button
                        onClick={createPost}
                        disabled={!newPost.trim()}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => {
                const postTypeColors: { [key: string]: { bg: string; border: string; badge: string; icon: string } } = {
                  achievement: { bg: "from-amber-50 to-orange-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: "text-amber-600" },
                  milestone: { bg: "from-green-50 to-emerald-50", border: "border-green-200", badge: "bg-green-100 text-green-800", icon: "text-green-600" },
                  memory: { bg: "from-purple-50 to-pink-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", icon: "text-purple-600" },
                  challenge: { bg: "from-blue-50 to-indigo-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: "text-blue-600" },
                  gratitude: { bg: "from-rose-50 to-pink-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-800", icon: "text-rose-600" }
                };
                const colors = postTypeColors[post.type] || postTypeColors.memory;

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <Card className={`bg-gradient-to-r ${colors.bg} border ${colors.border} shadow-sm hover:shadow-md transition-all`}>
                      <CardContent className="p-5">
                        <div className="flex space-x-3">
                          <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 flex-shrink-0 border-2 border-white shadow-sm">
                            {getMemberAvatar(post.author) ? (
                              <img src={getMemberAvatar(post.author)} alt={getMemberName(post.author)} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white font-bold text-sm">
                                {getMemberName(post.author).charAt(0)}
                              </span>
                            )}
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2 flex-wrap">
                              <span className="font-semibold text-gray-900 text-sm">
                                {getMemberName(post.author)}
                              </span>
                              <Badge className={`text-xs font-medium ${colors.badge}`}>
                                {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                              </Badge>
                              <span className="text-xs text-gray-600 font-medium">
                                {formatTimeAgo(post.timestamp)}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-3 text-sm leading-relaxed font-medium">{post.content}</p>

                            {/* Post Tags */}
                            {post.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {post.tags.map((tag, idx) => (
                                  <Badge 
                                    key={idx}
                                    variant="secondary" 
                                    className="text-xs bg-white bg-opacity-60 text-gray-700 font-medium border border-gray-200"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            )}

                            {/* Post Actions */}
                            <div className="flex items-center space-x-6 pt-3 border-t border-white border-opacity-40">
                              <button
                                onClick={() => likePost(post.id)}
                                className={`flex items-center space-x-1.5 transition-colors text-xs font-medium ${
                                  post.likes.includes(currentUserId)
                                    ? "text-red-600"
                                    : "text-gray-600 hover:text-red-600"
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${post.likes.includes(currentUserId) ? "fill-current" : ""}`} />
                                <span>{post.likes.length}</span>
                              </button>
                              <button className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments.length}</span>
                              </button>
                              <button className="flex items-center space-x-1.5 text-gray-600 hover:text-green-600 transition-colors text-xs font-medium">
                                <Share2 className="w-4 h-4" />
                                <span>Share</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === "achievements" && (
          <motion.div
            key="achievements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Achievement Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm">
                <CardContent className="p-5 text-center">
                  <Trophy className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-yellow-700">{achievements.length}</div>
                  <div className="text-sm text-yellow-700 font-semibold">Total Achievements</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-sm">
                <CardContent className="p-5 text-center">
                  <Star className="w-8 h-8 text-purple-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-purple-700">
                    {achievements.reduce((sum, a) => sum + a.points, 0)}
                  </div>
                  <div className="text-sm text-purple-700 font-semibold">Total Points</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 shadow-sm">
                <CardContent className="p-5 text-center">
                  <Flame className="w-8 h-8 text-orange-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-orange-700">7</div>
                  <div className="text-sm text-orange-700 font-semibold">Day Streak</div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 shadow-sm">
                <CardContent className="p-5 text-center">
                  <Crown className="w-8 h-8 text-yellow-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-yellow-700">
                    {achievements.filter(a => a.rarity === "legendary").length}
                  </div>
                  <div className="text-sm text-yellow-700 font-semibold">Legendary</div>
                </CardContent>
              </Card>
            </div>

            {/* Achievements Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="p-3 bg-gradient-to-r from-purple-300 to-pink-300 rounded-lg shadow-sm">
                            {achievement.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{achievement.title}</h3>
                            <Badge className={`text-xs font-semibold ${getRarityColor(achievement.rarity)}`}>
                              {getRarityIcon(achievement.rarity)}
                              <span className="ml-1 capitalize">{achievement.rarity}</span>
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-amber-700">+{achievement.points}</div>
                          <div className="text-xs text-amber-700 font-semibold">points</div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-800 mb-3 font-medium">{achievement.description}</p>

                      <div className="flex items-center justify-between text-xs text-gray-700 mb-3 font-medium">
                        <span>Earned {formatTimeAgo(achievement.earnedDate)}</span>
                        <span>{achievement.earnedBy.length} member(s)</span>
                      </div>

                      {/* Earned by avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {achievement.earnedBy.slice(0, 3).map((memberId, idx) => (
                            <Avatar key={idx} className="w-6 h-6 border-2 border-white bg-gradient-to-r from-blue-400 to-purple-400">
                              {getMemberAvatar(memberId) ? (
                                <img src={getMemberAvatar(memberId)} alt={getMemberName(memberId)} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-white text-xs font-semibold">
                                  {getMemberName(memberId).charAt(0)}
                                </span>
                              )}
                            </Avatar>
                          ))}
                          {achievement.earnedBy.length > 3 && (
                            <div className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                              <span className="text-xs text-gray-600">+{achievement.earnedBy.length - 3}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => likeAchievement(achievement.id)}
                            className={`flex items-center space-x-1 text-xs transition-colors ${
                              achievement.likes.includes(currentUserId)
                                ? "text-red-600"
                                : "text-gray-500 hover:text-red-600"
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${achievement.likes.includes(currentUserId) ? "fill-current" : ""}`} />
                            <span>{achievement.likes.length}</span>
                          </button>
                          <button
                            onClick={() => shareAchievement(achievement.id)}
                            className="flex items-center space-x-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>{achievement.shareCount}</span>
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "challenges" && (
          <motion.div
            key="challenges"
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
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </div>

            {/* Challenges Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {challenges.filter(c => c.isActive).map((challenge) => (
                <Card key={challenge.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3 border-b border-green-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900">{challenge.title}</CardTitle>
                        <Badge className="text-xs mt-2 bg-green-200 text-green-800 font-semibold">
                          {challenge.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-800 font-semibold">{challenge.duration}</div>
                        <div className="text-xs text-green-700 font-medium">
                          {Math.ceil((challenge.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4">
                    <p className="text-gray-800 text-sm font-medium">{challenge.description}</p>

                    {/* Progress for each participant */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-gray-900">Progress:</h4>
                      {challenge.participants.map((participantId) => {
                        const progress = challenge.progress[participantId] || 0;
                        const percentage = (progress / challenge.target) * 100;

                        return (
                          <div key={participantId} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-900">{getMemberName(participantId)}</span>
                              <span className="text-green-700 font-bold">{progress}/{challenge.target}</span>
                            </div>
                            <div className="w-full bg-green-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-green-600 to-emerald-600 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reward */}
                    <div className="p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border border-yellow-300 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Gift className="w-4 h-4 text-yellow-700" />
                        <span className="text-sm font-bold text-yellow-900">Reward:</span>
                        <span className="text-sm text-yellow-900 font-semibold">{challenge.reward}</span>
                      </div>
                    </div>

                    {/* Challenge Actions */}
                    <div className="flex justify-between items-center pt-2 border-t border-green-100">
                      <div className="text-xs text-green-700 font-medium">
                        Created by {getMemberName(challenge.createdBy)}
                      </div>
                      <div className="space-x-2">
                        <Button 
                          size="sm" 
                          className="border-2 border-green-400 bg-white text-green-700 hover:bg-green-50 font-semibold"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Log Progress
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Discuss
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === "memories" && (
          <motion.div
            key="memories"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center py-12">
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Family Memories</h3>
              <p className="text-gray-500 mb-6">
                Capture and share your favorite family moments
              </p>
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Memory
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};