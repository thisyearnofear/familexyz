import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Target,
  Clock,
  Users,
  Heart,
  Brain,
  Calendar,
  TrendingUp,
  Star,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Gift,
  Zap,
  Trophy,
  MessageCircle,
  BookOpen,
  Gamepad2,
  Camera,
  Music,
  Palette,
  Leaf,
  Home,
  Baby,
  Smile,
  RefreshCw
} from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  interests: string[];
  communicationStyle: "visual" | "auditory" | "kinesthetic";
  personalityTraits: string[];
}

interface Recommendation {
  id: string;
  type: "activity" | "conversation" | "challenge" | "tradition" | "learning";
  title: string;
  description: string;
  targetMembers: string[];
  duration: string;
  difficulty: "easy" | "medium" | "challenging";
  category: string;
  benefits: string[];
  instructions: string[];
  materials?: string[];
  personalizedReason: string;
  aiAgent: string;
  priority: "high" | "medium" | "low";
  tags: string[];
  estimatedImpact: {
    bonding: number;
    communication: number;
    growth: number;
    fun: number;
  };
}

interface PersonalizedRecommendationsProps {
  familyMembers: FamilyMember[];
  familyGoals: string[];
  recentActivities: string[];
  familyDynamics: {
    healthScore: number;
    strengths: string[];
    growthAreas: string[];
  };
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  familyMembers,
  familyGoals,
  recentActivities,
  familyDynamics
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate personalized recommendations based on family data
  useEffect(() => {
    generateRecommendations();
  }, [familyMembers, familyGoals, familyDynamics]);

  const generateRecommendations = () => {
    setIsGenerating(true);

    // Simulate AI-powered recommendation generation
    setTimeout(() => {
      const newRecommendations = createPersonalizedRecommendations();
      setRecommendations(newRecommendations);
      setIsGenerating(false);
    }, 1500);
  };

  const createPersonalizedRecommendations = (): Recommendation[] => {
    const recs: Recommendation[] = [];

    // Activity recommendations based on family interests
    const commonInterests = findCommonInterests();
    if (commonInterests.length > 0) {
      recs.push({
        id: "interest-activity-1",
        type: "activity",
        title: `Family ${commonInterests[0]} Session`,
        description: `Enjoy a shared ${commonInterests[0].toLowerCase()} activity that brings everyone together`,
        targetMembers: familyMembers.map(m => m.id),
        duration: "45-60 minutes",
        difficulty: "easy",
        category: "Bonding",
        benefits: ["Shared interests", "Quality time", "Skill building"],
        instructions: [
          `Set up a comfortable space for ${commonInterests[0].toLowerCase()}`,
          "Let each family member share their favorite aspect",
          "Create something together or teach each other new techniques",
          "End with sharing what everyone enjoyed most"
        ],
        materials: [`${commonInterests[0]} supplies`, "Comfortable seating", "Snacks and drinks"],
        personalizedReason: `Your family shares a love for ${commonInterests[0]}, making this a perfect bonding activity`,
        aiAgent: "Growth",
        priority: "high",
        tags: [commonInterests[0], "family-time", "creative"],
        estimatedImpact: { bonding: 85, communication: 70, growth: 60, fun: 90 }
      });
    }

    // Communication-style based recommendations
    const visualLearners = familyMembers.filter(m => m.communicationStyle === "visual");
    if (visualLearners.length >= 2) {
      recs.push({
        id: "visual-activity-1",
        type: "activity",
        title: "Family Vision Board Creation",
        description: "Create a visual representation of your family's dreams and goals together",
        targetMembers: visualLearners.map(m => m.id),
        duration: "60-90 minutes",
        difficulty: "easy",
        category: "Goal Setting",
        benefits: ["Visual goal setting", "Creative expression", "Future planning"],
        instructions: [
          "Gather magazines, photos, and art supplies",
          "Each person shares their personal and family dreams",
          "Create individual sections on a large board",
          "Discuss how to support each other's goals"
        ],
        materials: ["Large poster board", "Magazines", "Scissors", "Glue", "Markers"],
        personalizedReason: `${visualLearners.map(m => m.name).join(" and ")} learn best through visual methods`,
        aiAgent: "Wisdom",
        priority: "medium",
        tags: ["visual", "goals", "creative", "planning"],
        estimatedImpact: { bonding: 75, communication: 80, growth: 85, fun: 70 }
      });
    }

    // Age-appropriate cross-generational activities
    const hasMultipleGenerations = checkMultipleGenerations();
    if (hasMultipleGenerations) {
      recs.push({
        id: "generational-1",
        type: "tradition",
        title: "Family Story Exchange",
        description: "Share stories across generations to strengthen family bonds and preserve memories",
        targetMembers: familyMembers.map(m => m.id),
        duration: "30-45 minutes",
        difficulty: "easy",
        category: "Storytelling",
        benefits: ["Generational bonding", "Memory preservation", "Cultural continuity"],
        instructions: [
          "Choose a comfortable gathering space",
          "Start with older family members sharing childhood stories",
          "Encourage questions and follow-up stories",
          "Record or write down special stories to preserve them"
        ],
        personalizedReason: "Your multi-generational family can benefit from sharing wisdom and experiences",
        aiAgent: "GenerationalBridge",
        priority: "high",
        tags: ["storytelling", "generations", "memories", "tradition"],
        estimatedImpact: { bonding: 90, communication: 85, growth: 75, fun: 80 }
      });
    }

    // Recommendations based on family health score
    if (familyDynamics.healthScore < 70) {
      recs.push({
        id: "healing-activity-1",
        type: "conversation",
        title: "Family Appreciation Circle",
        description: "A gentle activity to rebuild positive connections and express gratitude",
        targetMembers: familyMembers.map(m => m.id),
        duration: "20-30 minutes",
        difficulty: "easy",
        category: "Healing",
        benefits: ["Positive focus", "Emotional healing", "Gratitude practice"],
        instructions: [
          "Sit in a circle facing each other",
          "Each person shares one thing they appreciate about each family member",
          "Use 'I appreciate you because...' format",
          "End with a group hug or positive affirmation"
        ],
        personalizedReason: "Your family could benefit from focusing on positive connections right now",
        aiAgent: "Intimacy",
        priority: "high",
        tags: ["appreciation", "healing", "gratitude", "emotional"],
        estimatedImpact: { bonding: 80, communication: 90, growth: 70, fun: 60 }
      });
    }

    // Goal-specific recommendations
    if (familyGoals.includes("communication")) {
      recs.push({
        id: "communication-1",
        type: "challenge",
        title: "Daily Check-in Challenge",
        description: "Establish a daily family communication ritual for better connection",
        targetMembers: familyMembers.map(m => m.id),
        duration: "10-15 minutes daily",
        difficulty: "easy",
        category: "Communication",
        benefits: ["Daily connection", "Emotional awareness", "Routine building"],
        instructions: [
          "Choose a consistent time each day (dinner, bedtime, etc.)",
          "Each person shares: high of the day, low of the day, something they're grateful for",
          "Practice active listening without judgment",
          "Track participation for one week"
        ],
        personalizedReason: "You've identified communication as a family goal",
        aiAgent: "Presence",
        priority: "high",
        tags: ["communication", "daily", "routine", "emotional-check-in"],
        estimatedImpact: { bonding: 75, communication: 95, growth: 80, fun: 65 }
      });
    }

    // Personality-based recommendations
    const creativeMembers = familyMembers.filter(m =>
      m.personalityTraits.includes("Creative") || m.interests.includes("Art")
    );
    if (creativeMembers.length >= 2) {
      recs.push({
        id: "creative-1",
        type: "activity",
        title: "Family Art Collaboration",
        description: "Create a collaborative art piece that represents your family's unique story",
        targetMembers: creativeMembers.map(m => m.id),
        duration: "90-120 minutes",
        difficulty: "medium",
        category: "Creative Expression",
        benefits: ["Creative collaboration", "Self-expression", "Family identity"],
        instructions: [
          "Choose a large canvas or multiple smaller ones",
          "Decide on a theme that represents your family",
          "Each person contributes their own section or element",
          "Discuss the meaning behind each contribution"
        ],
        materials: ["Canvas or paper", "Paints or art supplies", "Brushes", "Protective covering"],
        personalizedReason: `${creativeMembers.map(m => m.name).join(" and ")} have creative personalities`,
        aiAgent: "Growth",
        priority: "medium",
        tags: ["creative", "art", "collaboration", "expression"],
        estimatedImpact: { bonding: 80, communication: 70, growth: 85, fun: 95 }
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const findCommonInterests = (): string[] => {
    const interestCounts: { [key: string]: number } = {};

    familyMembers.forEach(member => {
      member.interests.forEach(interest => {
        interestCounts[interest] = (interestCounts[interest] || 0) + 1;
      });
    });

    return Object.entries(interestCounts)
      .filter(([_, count]) => count >= 2)
      .sort(([_, a], [__, b]) => b - a)
      .map(([interest, _]) => interest);
  };

  const checkMultipleGenerations = (): boolean => {
    const relationships = familyMembers.map(m => m.relationship);
    const hasGrandparent = relationships.includes("Grandparent");
    const hasParent = relationships.includes("Parent");
    const hasChild = relationships.includes("Child") || relationships.includes("Teen");

    return (hasGrandparent && hasParent) || (hasParent && hasChild);
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const categoryMatch = selectedCategory === "all" || rec.category === selectedCategory;
    const memberMatch = selectedMember === "all" || rec.targetMembers.includes(selectedMember);
    return categoryMatch && memberMatch;
  });

  const categories = ["all", ...Array.from(new Set(recommendations.map(r => r.category)))];

  const markAsCompleted = (recId: string) => {
    setCompletedActivities([...completedActivities, recId]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "activity": return <Gamepad2 className="w-4 h-4" />;
      case "conversation": return <MessageCircle className="w-4 h-4" />;
      case "challenge": return <Target className="w-4 h-4" />;
      case "tradition": return <Home className="w-4 h-4" />;
      case "learning": return <BookOpen className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-600 bg-red-50 border-red-200";
      case "medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "low": return "text-green-600 bg-green-50 border-green-200";
      default: return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>Personalized Recommendations</span>
          </h2>
          <p className="text-gray-600 mt-1">
            AI-powered suggestions tailored to your family's unique needs and interests
          </p>
        </div>
        <Button
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? "Generating..." : "Refresh Recommendations"}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Family Member</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All Members</option>
            {familyMembers.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredRecommendations.map((rec, index: number) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`h-full hover:shadow-lg transition-all ${
                completedActivities.includes(rec.id) ? "opacity-75 bg-green-50" : ""
              }`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(rec.type)}
                      <div>
                        <CardTitle className="text-lg">{rec.title}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {rec.category}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(rec.priority)}`}>
                            {rec.priority} priority
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {completedActivities.includes(rec.id) && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">{rec.description}</p>

                  {/* AI Personalization Reason */}
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Brain className="w-4 h-4 text-purple-600 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-purple-800 mb-1">
                          Why this is perfect for your family:
                        </p>
                        <p className="text-xs text-purple-700">{rec.personalizedReason}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{rec.duration}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 capitalize">{rec.difficulty}</span>
                    </div>
                  </div>

                  {/* Impact Visualization */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Expected Impact:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {Object.entries(rec.estimatedImpact).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="capitalize text-gray-600">{key}:</span>
                          <div className="flex items-center space-x-1">
                            <Progress value={value} className="w-12 h-1" />
                            <span className="text-gray-500">{value}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-1">
                    {rec.benefits.slice(0, 3).map((benefit, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDetails(showDetails === rec.id ? null : rec.id)}
                    >
                      {showDetails === rec.id ? "Hide Details" : "View Details"}
                    </Button>

                    {!completedActivities.includes(rec.id) ? (
                      <Button
                        size="sm"
                        onClick={() => markAsCompleted(rec.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark Complete
                      </Button>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completed!
                      </Badge>
                    )}
                  </div>

                  {/* Detailed Instructions */}
                  <AnimatePresence>
                    {showDetails === rec.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t pt-4 space-y-3"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Instructions:</h4>
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                            {rec.instructions.map((instruction, idx) => (
                              <li key={idx}>{instruction}</li>
                            ))}
                          </ol>
                        </div>

                        {rec.materials && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Materials Needed:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                              {rec.materials.map((material, idx) => (
                                <li key={idx}>{material}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Suggested by: {rec.aiAgent} Agent</span>
                          <div className="flex space-x-1">
                            {rec.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredRecommendations.length === 0 && !isGenerating && (
        <div className="text-center py-12">
          <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No recommendations found</h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or generate new recommendations
          </p>
          <Button onClick={generateRecommendations} variant="outline">
            Generate New Recommendations
          </Button>
        </div>
      )}
    </div>
  );
};