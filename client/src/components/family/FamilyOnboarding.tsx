import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { FamilyLogo } from "@/components/FamilyLogo";
import { GuidedTour } from "./GuidedTour";
import {
  Heart,
  Target,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Star,
  Trophy,
  Lightbulb,
  Zap,
  HelpCircle,
  BookOpen
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  helpContent?: {
    title: string;
    description: string;
    tips: string[];
  };
}

interface FamilyOnboardingProps {
  onComplete?: (profile: FamilyProfile) => void;
  onCancel?: () => void;
}

interface FamilyProfile {
  name: string;
  members: Array<{
    name: string;
    relationship: string;
    age?: number;
    interests?: string[];
    avatar?: string;
  }>;
  goals: string[];
  agents: string[];
  preferences: {
    communicationStyle: "warm" | "formal" | "casual";
    meetingFrequency: "daily" | "weekly" | "monthly";
    privacyLevel: "open" | "balanced" | "private";
    notifications: boolean;
    dataSharing: boolean;
  };
  customization: {
    theme: string;
    language: string;
    timezone: string;
  };
}

export const FamilyOnboarding: React.FC<FamilyOnboardingProps> = ({ onComplete, onCancel }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>({
    name: "",
    members: [],
    goals: [],
    agents: [],
    preferences: {
      communicationStyle: "warm",
      meetingFrequency: "weekly",
      privacyLevel: "balanced",
      notifications: true,
      dataSharing: false
    },
    customization: {
      theme: "family",
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    localStorage.setItem('familyOnboardingProgress', JSON.stringify({
      currentStep,
      familyProfile
    }));
  }, [currentStep, familyProfile]);

  // Load saved progress on mount
  useEffect(() => {
    const saved = localStorage.getItem('familyOnboardingProgress');
    if (saved) {
      try {
        const { currentStep: savedStep, familyProfile: savedProfile } = JSON.parse(saved);
        setCurrentStep(savedStep);
        setFamilyProfile(savedProfile);
      } catch (e) {
        console.warn('Failed to load onboarding progress');
      }
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Family Journey",
      subtitle: "Let's get to know your family",
      description: "Every family is unique. We'll help you create a personalized experience that strengthens your bonds.",
      icon: <Heart className="w-8 h-8 text-red-500" />,
      helpContent: {
        title: "Getting Started",
        description: "This onboarding will help us understand your family's unique needs and preferences.",
        tips: [
          "Take your time - you can always come back and change settings later",
          "Involve family members in the setup process for better engagement",
          "All information is kept private and secure"
        ]
      },
      component: (
        <WelcomeStep
          onNext={() => setCurrentStep(1)}
          onSkip={() => setCurrentStep(5)}
          onStartTour={() => setShowTour(true)}
        />
      )
    },
    {
      id: "family",
      title: "Tell Us About Your Family",
      subtitle: "Create your family profile",
      description: "Help us understand who's in your family and what matters most to you.",
      icon: <Users className="w-8 h-8 text-blue-500" />,
      helpContent: {
        title: "Family Profile Setup",
        description: "Creating detailed family profiles helps our AI agents provide more personalized guidance.",
        tips: [
          "Add interests and hobbies to get better activity recommendations",
          "Age information helps tailor communication styles",
          "You can add or remove family members anytime"
        ]
      },
      component: (
        <FamilyProfileStep
          profile={familyProfile}
          onUpdate={setFamilyProfile}
        />
      )
    },
    {
      id: "goals",
      title: "Set Your Family Goals",
      subtitle: "What do you want to achieve together?",
      description: "Choose the areas where you'd like to see your family grow and flourish.",
      icon: <Target className="w-8 h-8 text-green-500" />,
      helpContent: {
        title: "Setting Family Goals",
        description: "Goals help focus your family's growth journey and measure progress over time.",
        tips: [
          "Start with 2-3 goals to avoid overwhelming your family",
          "Goals can be adjusted as your family's needs change",
          "Each goal unlocks specific activities and guidance"
        ]
      },
      component: (
        <FamilyGoalsStep
          selectedGoals={familyProfile.goals}
          onGoalsChange={(goals) => setFamilyProfile(prev => ({...prev, goals}))}
        />
      )
    },
    {
      id: "agents",
      title: "Meet Your AI Family Team",
      subtitle: "Choose your AI companions",
      description: "Select the AI agents who will support your family's unique journey.",
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      helpContent: {
        title: "Your AI Family Team",
        description: "Each agent specializes in different aspects of family wellness and growth.",
        tips: [
          "Start with 2-3 agents and add more as you get comfortable",
          "Each agent has unique personality and expertise",
          "You can chat with agents individually or in group sessions"
        ]
      },
      component: (
        <AgentSelectionStep
          selectedAgents={familyProfile.agents}
          onAgentsChange={(agents) => setFamilyProfile(prev => ({...prev, agents}))}
        />
      )
    },
    {
      id: "preferences",
      title: "Customize Your Experience",
      subtitle: "Personalize your family's AI journey",
      description: "Set preferences that match your family's communication style and values.",
      icon: <Zap className="w-8 h-8 text-yellow-500" />,
      component: (
        <PreferencesStep
          preferences={familyProfile.preferences}
          onPreferencesChange={(prefs) => setFamilyProfile(prev => ({...prev, preferences: prefs}))}
        />
      )
    },
    {
      id: "complete",
      title: "Ready to Begin!",
      subtitle: "Your family journey starts now",
      description: "You're all set to strengthen your family bonds with AI-powered guidance.",
      icon: <Trophy className="w-8 h-8 text-orange-500" />,
      component: (
         <CompletionStep
           profile={familyProfile}
           onComplete={() => {
             onComplete?.(familyProfile);
           }}
         />
       )
    }
  ];

  // Show guided tour if requested
  if (showTour) {
    return (
      <GuidedTour
        onComplete={() => {
          setShowTour(false);
          setCurrentStep(1);
        }}
        onSkip={() => setShowTour(false)}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

      <div className="relative h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl mx-auto shadow-2xl border-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FamilyLogo className="text-white" />
                  <div>
                    <h1 className="text-xl font-bold">Family Connection</h1>
                    <p className="text-white/80 text-sm">AI-powered family wellness</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowHelp(!showHelp)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={onCancel}
                    className="text-white/70 hover:text-white transition-colors text-sm"
                  >
                    Skip Onboarding
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <Progress
                  value={(currentStep / (steps.length - 1)) * 100}
                  className="h-2 bg-white/20"
                />
                <span className="text-sm text-white/90">
                  {currentStep + 1} of {steps.length}
                </span>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                {steps[currentStep] && (
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {currentStep !== 0 && (
                      <>
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="p-3 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100">
                            {steps[currentStep]?.icon}
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                              {steps[currentStep]?.title}
                            </h2>
                            <p className="text-purple-600 font-semibold">
                              {steps[currentStep]?.subtitle}
                            </p>
                          </div>
                        </div>

                        <p className="text-gray-900 mb-8 font-semibold">
                          {steps[currentStep]?.description}
                        </p>
                      </>
                    )}

                  <div className="mb-8">
                    {steps[currentStep].component}
                  </div>

                  {/* Help Panel */}
                  <AnimatePresence>
                    {showHelp && steps[currentStep].helpContent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div className="flex items-start space-x-3">
                          <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-900 mb-2">
                              {steps[currentStep].helpContent!.title}
                            </h4>
                            <p className="text-blue-800 text-sm mb-3">
                              {steps[currentStep].helpContent!.description}
                            </p>
                            <ul className="space-y-1">
                              {steps[currentStep].helpContent!.tips.map((tip, index: number) => (
                                <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                                  <Star className="w-3 h-3 text-blue-500 mt-1 flex-shrink-0" />
                                  <span>{tip}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  </motion.div>
                  )}
                  </AnimatePresence>
                  </div>

                  {currentStep !== 0 && (
                  <div className="flex justify-between items-center px-8 pb-6">
                  <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2"
                  >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                  </Button>

                  <div className="flex space-x-2">
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentStep(5)} // Skip to completion
                    >
                      Skip for now
                    </Button>
                  )}

                  {currentStep < steps.length - 1 ? (
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2">
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center space-x-2"
                      onClick={() => onComplete?.(familyProfile)}
                    >
                      <Trophy className="w-4 h-4" />
                      <span>Start My Family Journey</span>
                    </Button>
                  )}
                  </div>
                  </div>
                  )}
                    </CardContent>
        </Card>
      </div>
    </div>
  );
};

const WelcomeStep: React.FC<{ onNext: () => void; onSkip: () => void; onStartTour?: () => void }> = ({ onNext, onSkip, onStartTour }) => {
  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-8 rounded-2xl">
        <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-4">
          Welcome to Your Family's AI Journey
        </h3>
        <p className="text-gray-600 mb-6">
          Our AI family agents are here to help strengthen your family bonds,
          improve communication, and create lasting memories together.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-white rounded-lg border border-purple-100">
            <div className="text-2xl mb-2">💬</div>
            <h4 className="font-semibold text-gray-800 mb-1">Better Communication</h4>
            <p className="text-sm text-gray-600">Learn to express and listen with love</p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-pink-100">
            <div className="text-2xl mb-2">🤝</div>
            <h4 className="font-semibold text-gray-800 mb-1">Stronger Bonds</h4>
            <p className="text-sm text-gray-600">Build deeper connections across generations</p>
          </div>
        </div>

        <div className="space-y-3">
          <Button onClick={onNext} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Start Setup
          </Button>
          {onStartTour && (
            <Button variant="outline" onClick={onStartTour} className="w-full">
              <BookOpen className="w-4 h-4 mr-2" />
              Take a Tour First
            </Button>
          )}
          <Button variant="outline" onClick={onSkip} className="w-full">
            Skip Setup
          </Button>
        </div>
      </div>
    </div>
  );
};

const FamilyProfileStep: React.FC<{
   profile: any;
   onUpdate: (profile: any) => void;
}> = ({ profile, onUpdate: _onUpdate }) => {
   const [familyName, setFamilyName] = useState(profile.name);
   const [members, setMembers] = useState(profile.members.length > 0 ? profile.members : [{ name: "", relationship: "Parent" }]);

  const addMember = () => setMembers([...members, { name: "", relationship: "Child" }]);
  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const canContinue = familyName.trim() && members.every((m: any) => m.name.trim());

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Name
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Johnson Family"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Family Members
          </label>
          <div className="space-y-3">
            {members.map((member: any, index: number) => (
              <div key={index} className="flex space-x-3">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <select
                  value={member.relationship}
                  onChange={(e) => updateMember(index, "relationship", e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
            onClick={addMember}
            className="w-full mt-2 border-dashed"
          >
            + Add Family Member
          </Button>
        </div>
      </div>
    </div>
  );
};

const FamilyGoalsStep: React.FC<{
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
}> = ({ selectedGoals, onGoalsChange }) => {
  const goals = [
    { id: "communication", label: "Better Communication", emoji: "💬", desc: "Help family members express themselves" },
    { id: "bonding", label: "Stronger Bonds", emoji: "❤️", desc: "Create more meaningful moments together" },
    { id: "conflict", label: "Peaceful Resolution", emoji: "🤝", desc: "Learn to navigate disagreements with love" },
    { id: "traditions", label: "Family Traditions", emoji: "🏠", desc: "Build and preserve meaningful customs" },
    { id: "growth", label: "Personal Growth", emoji: "🌱", desc: "Support each family member's journey" },
    { id: "mindfulness", label: "Mindful Living", emoji: "🧘", desc: "Find balance in our digital world" }
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter(id => id !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedGoals.includes(goal.id)
                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{goal.emoji}</div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{goal.label}</h3>
                <p className="text-sm text-gray-600">{goal.desc}</p>
              </div>
              {selectedGoals.includes(goal.id) && (
                <CheckCircle className="w-5 h-5 text-purple-500" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        Select the goals that resonate with your family's needs
      </div>
    </div>
  );
};

const AgentSelectionStep: React.FC<{
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
}> = ({ selectedAgents, onAgentsChange }) => {
  const agents = [
    { id: "wisdom", name: "Wisdom", emoji: "🧠", specialty: "Emotional Intelligence", desc: "Guides through life's big questions" },
    { id: "intimacy", name: "Intimacy", emoji: "💖", specialty: "Relationship Coaching", desc: "Strengthens family bonds" },
    { id: "bridge", name: "Bridge", emoji: "👵👦", specialty: "Generational Stories", desc: "Connects across generations" },
    { id: "presence", name: "Presence", emoji: "🧘", specialty: "Mindfulness", desc: "Promotes family presence" },
    { id: "growth", name: "Growth", emoji: "🌱", specialty: "Family Challenges", desc: "Encourages family growth" }
  ];

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onAgentsChange(selectedAgents.filter(id => id !== agentId));
    } else {
      onAgentsChange([...selectedAgents, agentId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => toggleAgent(agent.id)}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
              selectedAgents.includes(agent.id)
                ? "border-purple-500 bg-purple-50 ring-2 ring-purple-200"
                : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
            }`}
          >
            <div className="text-center">
              <div className="text-3xl mb-3">{agent.emoji}</div>
              <h3 className="font-bold text-lg text-gray-800 mb-1">{agent.name}</h3>
              <p className="text-sm font-medium text-gray-600 mb-2">{agent.specialty}</p>
              <p className="text-sm text-gray-600 mb-3">{agent.desc}</p>

              <div className="flex flex-wrap justify-center gap-1">
                <Badge variant="secondary" className="text-xs">Supports</Badge>
                <Badge variant="secondary" className="text-xs">Guidance</Badge>
              </div>

              {selectedAgents.includes(agent.id) && (
                <div className="mt-3 flex items-center justify-center text-purple-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        Choose 2-3 agents to start with - you can always add more later
      </div>
    </div>
  );
};

const PreferencesStep: React.FC<{
  preferences: any;
  onPreferencesChange: (prefs: any) => void;
}> = ({ preferences, onPreferencesChange }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Communication Style
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: "formal", label: "Professional", desc: "Clear, structured communication", emoji: "👔" },
            { value: "warm", label: "Warm & Friendly", desc: "Caring, supportive tone", emoji: "🤗" },
            { value: "casual", label: "Relaxed", desc: "Playful, informal style", emoji: "😊" }
          ].map((style) => (
            <div
              key={style.value}
              onClick={() => onPreferencesChange({ ...preferences, communicationStyle: style.value })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.communicationStyle === style.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{style.emoji}</div>
                <h4 className="font-medium text-gray-800">{style.label}</h4>
                <p className="text-xs text-gray-600">{style.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Check-in Frequency
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: "daily", label: "Daily", desc: "Brief daily moments", emoji: "📅" },
            { value: "weekly", label: "Weekly", desc: "Weekly sessions", emoji: "📅" },
            { value: "monthly", label: "Monthly", desc: "Monthly reviews", emoji: "📅" }
          ].map((freq) => (
            <div
              key={freq.value}
              onClick={() => onPreferencesChange({ ...preferences, meetingFrequency: freq.value })}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.meetingFrequency === freq.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{freq.emoji}</div>
                <h4 className="font-medium text-gray-800">{freq.label}</h4>
                <p className="text-xs text-gray-600">{freq.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CompletionStep: React.FC<{
  profile: any;
  onComplete?: (profile: any) => void;
}> = ({ profile, onComplete }) => {
  return (
    <div className="text-center space-y-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-600 mb-6">
          Your family profile is ready. Your AI agents are prepared to help strengthen your family bonds.
        </p>
      </motion.div>

      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl">
        <h4 className="font-semibold text-gray-800 mb-4">Your Family Profile</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Family Name</h5>
            <p className="font-medium">{profile.name || "Not specified"}</p>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Family Members</h5>
            <p className="font-medium">{profile.members.length} members</p>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">Selected Goals</h5>
            <p className="font-medium">{profile.goals.length} goals</p>
          </div>
          <div>
            <h5 className="text-sm font-medium text-gray-600 mb-1">AI Agents</h5>
            <p className="font-medium">{profile.agents.length} agents</p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-gray-600">
          Your family journey starts now. Your AI agents will help you build stronger bonds,
          improve communication, and create lasting memories together.
        </p>

        <Button
          onClick={() => onComplete?.(profile)}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg py-4"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Start My Family Journey
        </Button>
      </div>
    </div>
  );
};

// Contextual Guidance Component
export const FamilyGuidance: React.FC = () => {
  const [showGuidance, setShowGuidance] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {showGuidance && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl p-6 mb-4 max-w-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-gray-800">Family Tip</h3>
              </div>
              <button
                onClick={() => setShowGuidance(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Did you know? Families that have just 15 minutes of device-free conversation daily
              report 40% stronger emotional connections.
            </p>
            <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
              Try This Today
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setShowGuidance(!showGuidance)}
        className="w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
      >
        <Sparkles className="w-6 h-6" />
      </Button>
    </div>
  );
};