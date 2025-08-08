import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { Heart, ArrowRight, Check } from "lucide-react";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
}

interface FamilyProfile {
  familyName: string;
  members: FamilyMember[];
  goals: string[];
  preferences: {
    communicationStyle: string;
    meetingFrequency: string;
    privacyLevel: string;
  };
  selectedAgents: string[];
}

const FAMILY_GOALS = [
  {
    id: "communication",
    label: "Better Communication",
    icon: "💬",
    description:
      "Help family members express themselves and listen to each other",
  },
  {
    id: "bonding",
    label: "Stronger Bonds",
    icon: "❤️",
    description: "Create more meaningful moments together as a family",
  },
  {
    id: "conflict",
    label: "Peaceful Conflict Resolution",
    icon: "🤝",
    description: "Learn to navigate disagreements with love and understanding",
  },
  {
    id: "traditions",
    label: "Family Traditions",
    icon: "🏠",
    description: "Build and preserve meaningful family customs and memories",
  },
  {
    id: "growth",
    label: "Personal Growth",
    icon: "🌱",
    description: "Support each family member in their individual journey",
  },
  {
    id: "mindfulness",
    label: "Mindful Living",
    icon: "🧘",
    description: "Find balance and presence in our busy digital world",
  },
];

const FAMILY_AGENTS = [
  {
    id: "sophia",
    name: "Sophia",
    emoji: "🧠",
    specialty: "Philosophy & Emotional Intelligence",
    description:
      "Guides your family through life's big questions with wisdom and empathy",
    benefits: ["Conflict resolution", "Emotional growth", "Family values"],
  },
  {
    id: "amore",
    name: "Amore",
    emoji: "💖",
    specialty: "Relationship Coaching",
    description:
      "Helps deepen the bonds between family members through love and understanding",
    benefits: [
      "Couple connection",
      "Parent-child bonding",
      "Communication skills",
    ],
  },
  {
    id: "legacy",
    name: "Legacy",
    emoji: "👨‍👩‍👧‍👦",
    specialty: "Cross-generational Stories",
    description:
      "Bridges hearts across generations through storytelling and shared wisdom",
    benefits: [
      "Family history",
      "Generational bonding",
      "Cultural preservation",
    ],
  },
  {
    id: "zen",
    name: "Zen",
    emoji: "🧘‍♀️",
    specialty: "Mindfulness & Digital Wellness",
    description: "Brings peace and presence to your family's daily life",
    benefits: ["Stress reduction", "Digital balance", "Mindful moments"],
  },
  {
    id: "bloom",
    name: "Bloom",
    emoji: "🌱",
    specialty: "Family Growth Challenges",
    description:
      "Inspires your family to grow stronger together through fun challenges",
    benefits: ["Goal achievement", "Family activities", "Positive habits"],
  },
];

const StepIndicator = ({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {Array.from({ length: totalSteps }, (_, i) => (
      <div key={i} className="flex items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
            i + 1 <= currentStep
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          {i + 1 <= currentStep ? <Check className="w-4 h-4" /> : i + 1}
        </div>
        {i < totalSteps - 1 && (
          <div
            className={`w-8 h-1 mx-2 rounded-full transition-all duration-300 ${
              i + 1 < currentStep
                ? "bg-gradient-to-r from-purple-500 to-pink-500"
                : "bg-gray-200"
            }`}
          />
        )}
      </div>
    ))}
  </div>
);

const GoalCard = ({
  goal,
  isSelected,
  onToggle,
}: {
  goal: (typeof FAMILY_GOALS)[0];
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <Card
    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
      isSelected
        ? "ring-2 ring-purple-500 bg-purple-50 border-purple-200"
        : "hover:shadow-md border-gray-200"
    }`}
    onClick={onToggle}
  >
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{goal.icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 mb-1">{goal.label}</h3>
          <p className="text-sm text-gray-600">{goal.description}</p>
        </div>
        {isSelected && (
          <div className="text-purple-500">
            <Check className="w-5 h-5" />
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const AgentCard = ({
  agent,
  isSelected,
  onToggle,
}: {
  agent: (typeof FAMILY_AGENTS)[0];
  isSelected: boolean;
  onToggle: () => void;
}) => (
  <Card
    className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
      isSelected
        ? "ring-2 ring-blue-500 bg-blue-50 border-blue-200"
        : "hover:shadow-md border-gray-200"
    }`}
    onClick={onToggle}
  >
    <CardContent className="p-6">
      <div className="text-center">
        <div className="text-4xl mb-3">{agent.emoji}</div>
        <h3 className="font-bold text-lg text-gray-800 mb-1">{agent.name}</h3>
        <p className="text-sm font-medium text-gray-600 mb-3">
          {agent.specialty}
        </p>
        <p className="text-sm text-gray-600 mb-4">{agent.description}</p>

        <div className="space-y-1">
          {agent.benefits.map((benefit, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs mr-1 mb-1"
            >
              {benefit}
            </Badge>
          ))}
        </div>

        {isSelected && (
          <div className="mt-4 flex items-center justify-center text-blue-500">
            <Check className="w-5 h-5 mr-1" />
            <span className="text-sm font-medium">Selected</span>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

export default function FamilyWelcome({
  onComplete,
}: {
  onComplete: (profile: FamilyProfile) => void;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<FamilyProfile>({
    familyName: "",
    members: [{ name: "", relationship: "Parent" }],
    goals: [],
    preferences: {
      communicationStyle: "warm",
      meetingFrequency: "weekly",
      privacyLevel: "balanced",
    },
    selectedAgents: [],
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addFamilyMember = () => {
    setProfile((prev) => ({
      ...prev,
      members: [...prev.members, { name: "", relationship: "Child" }],
    }));
  };

  const updateFamilyMember = (
    index: number,
    field: keyof FamilyMember,
    value: string | number,
  ) => {
    setProfile((prev) => ({
      ...prev,
      members: prev.members.map((member, i) =>
        i === index ? { ...member, [field]: value } : member,
      ),
    }));
  };

  const toggleGoal = (goalId: string) => {
    setProfile((prev) => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter((g) => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const toggleAgent = (agentId: string) => {
    setProfile((prev) => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agentId)
        ? prev.selectedAgents.filter((a) => a !== agentId)
        : [...prev.selectedAgents, agentId],
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return (
          profile.familyName.trim() &&
          profile.members.every((m) => m.name.trim())
        );
      case 2:
        return profile.goals.length > 0;
      case 3:
        return profile.selectedAgents.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome to Your Family's AI Journey
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Let's create a personalized experience that helps your family grow
            closer, communicate better, and create lasting memories together
          </p>
        </div>

        <StepIndicator currentStep={currentStep} totalSteps={4} />

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Tell Us About Your Family
                  </h2>
                  <p className="text-gray-600">
                    Every family is unique, and we'd love to know about yours
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="familyName"
                      className="text-sm font-medium text-gray-700"
                    >
                      What would you like to call your family? ✨
                    </Label>
                    <Input
                      id="familyName"
                      placeholder="The Johnson Family"
                      value={profile.familyName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          familyName: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      Who's in your family? 👨‍👩‍👧‍👦
                    </Label>
                    <div className="space-y-3">
                      {profile.members.map((member, index) => (
                        <div key={index} className="flex space-x-3">
                          <Input
                            placeholder="Name"
                            value={member.name}
                            onChange={(e) =>
                              updateFamilyMember(index, "name", e.target.value)
                            }
                            className="flex-1"
                          />
                          <select
                            value={member.relationship}
                            onChange={(e) =>
                              updateFamilyMember(
                                index,
                                "relationship",
                                e.target.value,
                              )
                            }
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                          >
                            <option value="Parent">Parent</option>
                            <option value="Child">Child</option>
                            <option value="Teen">Teen</option>
                            <option value="Grandparent">Grandparent</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      onClick={addFamilyMember}
                      className="mt-3 w-full border-dashed"
                    >
                      + Add Another Family Member
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    What Are Your Family's Dreams?
                  </h2>
                  <p className="text-gray-600">
                    Choose the areas where you'd like to see your family grow
                    and flourish
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {FAMILY_GOALS.map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      isSelected={profile.goals.includes(goal.id)}
                      onToggle={() => toggleGoal(goal.id)}
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-gray-500">
                  💡 Select as many goals as resonate with your family - you can
                  always adjust these later
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Meet Your AI Family Team
                  </h2>
                  <p className="text-gray-600">
                    Choose the AI companions who will support your family's
                    journey
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {FAMILY_AGENTS.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      isSelected={profile.selectedAgents.includes(agent.id)}
                      onToggle={() => toggleAgent(agent.id)}
                    />
                  ))}
                </div>

                <div className="text-center text-sm text-gray-500">
                  🌟 We recommend starting with 2-3 agents and adding more as
                  your family gets comfortable
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    Almost Ready! 🎉
                  </h2>
                  <p className="text-gray-600">
                    A few final touches to personalize your experience
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      How would you like your AI family to communicate? 💬
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          value: "formal",
                          label: "Professional & Structured",
                          desc: "Clear, organized communication",
                        },
                        {
                          value: "warm",
                          label: "Warm & Friendly",
                          desc: "Caring, supportive tone",
                        },
                        {
                          value: "casual",
                          label: "Casual & Fun",
                          desc: "Relaxed, playful style",
                        },
                      ].map((style) => (
                        <Card
                          key={style.value}
                          className={`cursor-pointer transition-all duration-200 ${
                            profile.preferences.communicationStyle ===
                            style.value
                              ? "ring-2 ring-purple-500 bg-purple-50"
                              : "hover:shadow-md"
                          }`}
                          onClick={() =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                communicationStyle: style.value,
                              },
                            }))
                          }
                        >
                          <CardContent className="p-4 text-center">
                            <h3 className="font-medium text-gray-800">
                              {style.label}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {style.desc}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-3 block">
                      How often would you like family check-ins? 📅
                    </Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        {
                          value: "daily",
                          label: "Daily",
                          desc: "Brief daily moments",
                        },
                        {
                          value: "weekly",
                          label: "Weekly",
                          desc: "Thoughtful weekly sessions",
                        },
                        {
                          value: "monthly",
                          label: "Monthly",
                          desc: "Deep monthly reviews",
                        },
                      ].map((freq) => (
                        <Card
                          key={freq.value}
                          className={`cursor-pointer transition-all duration-200 ${
                            profile.preferences.meetingFrequency === freq.value
                              ? "ring-2 ring-blue-500 bg-blue-50"
                              : "hover:shadow-md"
                          }`}
                          onClick={() =>
                            setProfile((prev) => ({
                              ...prev,
                              preferences: {
                                ...prev.preferences,
                                meetingFrequency: freq.value,
                              },
                            }))
                          }
                        >
                          <CardContent className="p-4 text-center">
                            <h3 className="font-medium text-gray-800">
                              {freq.label}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {freq.desc}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-12 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <span>← Back</span>
              </Button>

              <div className="text-sm text-gray-500">
                Step {currentStep} of 4
              </div>

              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <span>
                  {currentStep === 4 ? "Start Our Journey" : "Continue"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Note */}
        <div className="text-center mt-8 text-sm text-gray-500">
          🔒 Your family's privacy is our priority. All data is encrypted and
          never shared with third parties.
        </div>
      </div>
    </div>
  );
}
