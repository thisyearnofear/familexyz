import React, { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  BookOpen,
  Wallet,
  Coins
} from "lucide-react";
import { useWalletConnection } from "@elizaos/hedera-wallet/react";

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
      id: "wallet",
      title: "Setup Family Treasury",
      subtitle: "Power your AI with Hedera",
      description: "Connect a wallet to fund your Family Agent's intelligence and enable rewards.",
      icon: <Wallet className="w-8 h-8 text-indigo-500" />,
      helpContent: {
        title: "Family Treasury",
        description: "The Family Treasury uses HBAR to pay for AI inference and reward family members.",
        tips: [
          "You can skip this step and set it up later in Settings",
          "HashPack is the recommended wallet for the best experience",
          "Funds are used for AI processing and family rewards"
        ]
      },
      component: (
        <WalletSetupStep />
      )
    },
    {
      id: "complete",
      title: "Ready to Begin!",
      subtitle: "Your family journey starts now",
      description: "",
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

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-sm font-medium text-white/90">Step {currentStep + 1} of {steps.length}</span>
                   <span className="text-sm font-medium text-white/90">{Math.round((currentStep / (steps.length - 1)) * 100)}% Complete</span>
                </div>

                <div className="flex items-center space-x-3">
                    {/* Prev Button */}
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                        aria-label="Previous step"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 flex justify-between items-center relative px-2">
                      {/* Progress Line Background */}
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/20 -z-0"></div>

                      {/* Steps */}
                      {steps.map((step, index) => (
                        <button
                          key={step.id}
                          onClick={() => index <= currentStep ? setCurrentStep(index) : null}
                          disabled={index > currentStep}
                          className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-200 border-2
                            ${index === currentStep
                              ? "bg-white text-purple-600 border-white scale-110 shadow-lg"
                              : index < currentStep
                                ? "bg-purple-400 text-white border-purple-400 hover:bg-purple-300"
                                : "bg-purple-900/50 text-white/40 border-white/10"
                            }`}
                        >
                          {index < currentStep ? <CheckCircle className="w-5 h-5" /> : index + 1}
                        </button>
                      ))}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                        disabled={currentStep === steps.length - 1}
                        className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
                        aria-label="Next step"
                    >
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-8 bg-white">
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
                        <div className="text-center mb-6">
                          <div className="flex justify-center mb-4">
                            <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl">
                              {steps[currentStep]?.icon}
                            </div>
                          </div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                            {steps[currentStep]?.title}
                          </h2>
                          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base px-4 py-1">
                            {steps[currentStep]?.subtitle}
                          </Badge>
                          <p className="text-gray-800 text-lg max-w-2xl mx-auto font-semibold">
                            {steps[currentStep]?.description}
                          </p>
                        </div>
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
                  <div className="flex justify-between items-center px-8 pb-8 pt-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                  <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 min-w-[120px] border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back</span>
                  </Button>

                  <div className="flex space-x-3">
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setCurrentStep(5)} // Skip to completion
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Skip for now
                    </Button>
                  )}

                  {currentStep < steps.length - 1 ? (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 flex items-center space-x-2 min-w-[140px] shadow-md hover:shadow-lg transition-all"
                      onClick={() => setCurrentStep(currentStep + 1)}
                    >
                      <span className="font-bold">Continue</span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 flex items-center space-x-2 min-w-[200px] shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                      onClick={() => onComplete?.(familyProfile)}
                    >
                      <Trophy className="w-5 h-5" />
                      <span className="font-bold">Start My Family Journey</span>
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
      <div className="bg-gradient-to-b from-purple-50 to-white p-6 rounded-2xl border border-purple-200 shadow-sm">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Your Family Journey
        </h3>
        <p className="text-purple-600 font-semibold text-sm mb-4 uppercase tracking-wide">
          AI-powered family wellness platform
        </p>

        <p className="text-gray-800 text-base mb-6 max-w-xl mx-auto leading-relaxed">
          Strengthen family bonds with AI-powered guidance designed specifically for how your family <span className="font-bold text-purple-700">communicates</span>, <span className="font-bold text-pink-600">grows</span>, and <span className="font-bold text-blue-600">connects</span>.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center text-sm">
            <Lightbulb className="w-4 h-4 mr-2" />
            Key Features:
          </h4>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2 text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Every family is unique - we'll personalize everything for you</span>
            </li>
            <li className="flex items-start space-x-2 text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">Your privacy and data security are our top priorities</span>
            </li>
            <li className="flex items-start space-x-2 text-blue-800">
              <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span className="text-sm">You can customize your experience at any time</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          <p className="text-xs text-gray-600 italic">
            Your family's personalized AI-powered wellness journey starts here
          </p>

          <Button onClick={onNext} size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-base shadow-lg hover:shadow-xl transition-all">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex gap-2">
            {onStartTour && (
              <Button variant="outline" size="sm" onClick={onStartTour} className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-sm">
                <BookOpen className="w-4 h-4 mr-1" />
                Take Tour
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onSkip} className="flex-1 text-gray-600 hover:text-gray-900 text-sm">
              Skip
            </Button>
          </div>
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

  // Update parent state when local state changes
  useEffect(() => {
    _onUpdate({ ...profile, name: familyName, members });
  }, [familyName, members]);

  return (
    <div className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-200 rounded-xl p-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            Family Name
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Johnson Family"
            className="w-full p-2.5 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 mb-1.5">
            Family Members
          </label>
          <div className="space-y-2">
            {members.map((member: any, index: number) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => updateMember(index, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1 p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium text-sm"
                />
                <select
                  value={member.relationship}
                  onChange={(e) => updateMember(index, "relationship", e.target.value)}
                  className="p-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900 font-medium text-sm"
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
            className="w-full mt-2 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold text-sm py-2"
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
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedGoals.includes(goal.id)
                ? "border-purple-500 bg-purple-100 shadow-md"
                : "border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50"
            }`}
          >
            <div className="flex items-start space-x-2">
              <div className="text-2xl">{goal.emoji}</div>
              <div className="flex-1">
                <h3 className="font-bold text-sm text-gray-900 leading-tight">{goal.label}</h3>
                <p className="text-xs text-gray-700 mt-0.5">{goal.desc}</p>
              </div>
              {selectedGoals.includes(goal.id) && (
                <CheckCircle className="w-4 h-4 text-purple-600 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-700 font-medium bg-blue-50 border border-blue-200 rounded-lg p-2">
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
    { id: "wisdom", name: "Wisdom", emoji: "🧠", specialty: "Emotional Intelligence" },
    { id: "intimacy", name: "Intimacy", emoji: "💖", specialty: "Relationship Coaching" },
    { id: "bridge", name: "Bridge", emoji: "👵👦", specialty: "Generational Stories" },
    { id: "presence", name: "Presence", emoji: "🧘", specialty: "Mindfulness" },
    { id: "growth", name: "Growth", emoji: "🌱", specialty: "Family Challenges" }
  ];

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      onAgentsChange(selectedAgents.filter(id => id !== agentId));
    } else {
      onAgentsChange([...selectedAgents, agentId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => toggleAgent(agent.id)}
            className={`p-2 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedAgents.includes(agent.id)
                ? "border-purple-500 bg-purple-100 shadow-md"
                : "border-purple-200 bg-white hover:border-purple-400 hover:bg-purple-50"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{agent.emoji}</div>
              <h3 className="font-bold text-xs text-gray-900 mb-0.5">{agent.name}</h3>
              <p className="text-[10px] text-gray-700 leading-tight">{agent.specialty}</p>

              {selectedAgents.includes(agent.id) && (
                <div className="mt-1 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-xs text-gray-700 font-medium bg-blue-50 border border-blue-200 rounded-lg p-2">
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
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Communication Style
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "formal", label: "Professional", emoji: "👔" },
            { value: "warm", label: "Warm & Friendly", emoji: "🤗" },
            { value: "casual", label: "Relaxed", emoji: "😊" }
          ].map((style) => (
            <div
              key={style.value}
              onClick={() => onPreferencesChange({ ...preferences, communicationStyle: style.value })}
              className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.communicationStyle === style.value
                  ? "border-purple-500 bg-purple-100"
                  : "border-purple-200 bg-white hover:border-purple-400"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{style.emoji}</div>
                <h4 className="font-bold text-xs text-gray-900">{style.label}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-900 mb-2">
          Check-in Frequency
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "daily", label: "Daily", emoji: "📅" },
            { value: "weekly", label: "Weekly", emoji: "📅" },
            { value: "monthly", label: "Monthly", emoji: "📅" }
          ].map((freq) => (
            <div
              key={freq.value}
              onClick={() => onPreferencesChange({ ...preferences, meetingFrequency: freq.value })}
              className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                preferences.meetingFrequency === freq.value
                  ? "border-purple-500 bg-purple-100"
                  : "border-purple-200 bg-white hover:border-purple-400"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-1">{freq.emoji}</div>
                <h4 className="font-bold text-xs text-gray-900">{freq.label}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WalletSetupStep: React.FC = () => {
  const { isConnected, isConnecting, connectWallet, connection } = useWalletConnection();
  const [balance, setBalance] = useState<string>("0");

  useEffect(() => {
    if (isConnected && connection?.accountId) {
      fetch(
        `https://testnet.mirrornode.hedera.com/api/v1/accounts/${connection.accountId}`
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.balance) {
            setBalance(
              (data.balance.balance / 100_000_000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
          }
        })
        .catch((err) => console.error("Failed to fetch balance:", err));
    }
  }, [isConnected, connection?.accountId]);

  const handleConnect = async () => {
    try {
      await connectWallet("hashpack");
    } catch (error) {
      console.error("Wallet connection failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 text-center">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <Wallet className="w-8 h-8 text-indigo-600" />
        </div>

        <h3 className="text-xl font-bold text-indigo-900 mb-2">
          {isConnected ? "Wallet Connected!" : "Connect Family Wallet"}
        </h3>

        <p className="text-gray-600 max-w-md mx-auto mb-6">
          {isConnected
            ? "Your family treasury is ready to go. You can manage funds and rewards from the dashboard."
            : "Link a Hedera wallet to unlock advanced AI features and create a reward system for your family."}
        </p>

        {!isConnected ? (
          <div className="space-y-3">
            <Button
              onClick={handleConnect}
              disabled={isConnecting}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              {isConnecting ? "Connecting..." : "Connect HashPack"}
            </Button>
            <p className="text-xs text-gray-500">
              Don't have a wallet? <a href="https://www.hashpack.app/" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Get HashPack</a>
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-lg border border-indigo-100 max-w-xs mx-auto shadow-sm">
             <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Balance</p>
             <div className="flex items-center justify-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold text-gray-900">{balance}</span>
                <span className="text-sm text-gray-500 font-medium">HBAR</span>
             </div>
             <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 font-mono truncate">
               {connection?.accountId}
             </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🧠</span> AI Intelligence
          </h4>
          <p className="text-sm text-gray-600">
            HBAR powers the advanced reasoning capabilities of your Family Agents.
          </p>
        </div>
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <span className="text-xl">🏆</span> Family Rewards
          </h4>
          <p className="text-sm text-gray-600">
            Create challenges and reward family members with tokens for achieving goals.
          </p>
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
    <div className="text-center space-y-4">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          You're All Set!
        </h3>
        <p className="text-gray-800 text-base font-medium mb-4 max-w-lg mx-auto">
          Your family profile is ready. Your AI agents are prepared to help strengthen your family bonds.
        </p>
      </motion.div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left max-w-lg mx-auto">
        <h4 className="font-bold text-blue-900 mb-3 text-sm">Your Family Profile Summary</h4>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <h5 className="text-xs font-semibold text-blue-700 mb-0.5">Family Name</h5>
            <p className="font-bold text-blue-900">{profile.name || "Not specified"}</p>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-blue-700 mb-0.5">Family Members</h5>
            <p className="font-bold text-blue-900">{profile.members.length} members</p>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-blue-700 mb-0.5">Selected Goals</h5>
            <p className="font-bold text-blue-900">{profile.goals.length} goals</p>
          </div>
          <div>
            <h5 className="text-xs font-semibold text-blue-700 mb-0.5">AI Agents</h5>
            <p className="font-bold text-blue-900">{profile.agents.length} agents</p>
          </div>
        </div>
      </div>

      <Button
        onClick={() => onComplete?.(profile)}
        className="w-full max-w-md mx-auto bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-base font-bold py-4 shadow-lg hover:shadow-xl transition-all"
      >
        <Trophy className="w-5 h-5 mr-2" />
        Start My Family Journey
      </Button>
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