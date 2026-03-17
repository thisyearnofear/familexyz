import React, { useState, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FamilyLogo } from "@/components/FamilyLogo";
import {
  Heart,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Star,
  Trophy,
  Lightbulb,
  HelpCircle
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

  const [currentStep, setCurrentStep] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
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
    setShowSaved(true);
    const timer = setTimeout(() => setShowSaved(false), 2000);
    return () => clearTimeout(timer);
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
          onSkip={() => setCurrentStep(3)}
        />
      )
    },
    {
      id: "family",
      title: "Set Up Your Family",
      subtitle: "Tell us about your family",
      description: "Create your family profile in just a few seconds.",
      icon: <Users className="w-8 h-8 text-blue-500" />,
      helpContent: {
        title: "Family Profile Setup",
        description: "Quickly add your family name and yourself. You can add more members anytime in Settings.",
        tips: [
          "Start with yourself - add other family members later",
          "Your family name helps personalize the experience",
          "You can always update this information later"
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
      id: "agents",
      title: "Pick Your AI Team",
      subtitle: "Choose your AI companions (optional)",
      description: "Select AI agents to help your family grow. You can skip this and customize later.",
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      helpContent: {
        title: "Your AI Family Team",
        description: "Each agent specializes in different aspects of family wellness. Start with 2-3 or skip entirely.",
        tips: [
          "You can skip this step and set it up later",
          "Start with 2-3 agents and add more as you get comfortable",
          "You can customize your agent selection in Settings anytime"
        ]
      },
      component: (
        <AgentSelectionStep
          selectedAgents={familyProfile.agents}
          onAgentsChange={(agents) => setFamilyProfile(prev => ({...prev, agents}))}
          isOptional={true}
        />
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
                   <div className="flex items-center space-x-3">
                     <span className="text-sm font-medium text-white/90">{Math.round((currentStep / (steps.length - 1)) * 100)}% Complete</span>
                     {showSaved && (
                       <span className="text-xs text-green-300 bg-green-500/20 px-2 py-0.5 rounded-full flex items-center">
                         <CheckCircle className="w-3 h-3 mr-1" /> Saved
                       </span>
                     )}
                   </div>
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
                              ? "bg-card text-purple-600 border-white scale-110 shadow-lg"
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
            <div className="p-8 bg-card">
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
                          <p className="text-foreground text-lg max-w-2xl mx-auto font-semibold">
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
                        className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
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
                  <div className="flex justify-between items-center px-8 pb-8 pt-4 border-t border-gray-100 bg-muted/50 rounded-b-xl">
                  <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="flex items-center space-x-2 min-w-[120px] border-gray-300 hover:bg-muted text-foreground"
                  >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back</span>
                  </Button>

                  <div className="flex space-x-3">
                  {currentStep > 0 && currentStep < steps.length - 1 && (
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => setCurrentStep(steps.length - 1)} // Skip to completion
                      className="text-muted-foreground hover:text-foreground"
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

const WelcomeStep: React.FC<{ onNext: () => void; onSkip: () => void }> = ({ onNext, onSkip }) => {
  return (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-b from-purple-50 to-white p-6 rounded-2xl border border-purple-500/20 shadow-sm">
        <div className="text-5xl mb-4">👨‍👩‍👧‍👦</div>

        <h3 className="text-2xl font-bold text-foreground mb-2">
          Welcome to Your Family Journey
        </h3>
        <p className="text-purple-600 font-semibold text-sm mb-4 uppercase tracking-wide">
          AI-powered family wellness platform
        </p>

        <p className="text-foreground text-base mb-6 max-w-xl mx-auto leading-relaxed">
          Strengthen family bonds with AI-powered guidance designed specifically for how your family <span className="font-bold text-purple-700">communicates</span>, <span className="font-bold text-pink-600">grows</span>, and <span className="font-bold text-blue-600">connects</span>.
        </p>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left mb-6">
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
          <p className="text-xs text-muted-foreground italic">
            Your family's personalized AI-powered wellness journey starts here
          </p>

          <Button onClick={onNext} size="lg" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-base shadow-lg hover:shadow-xl transition-all">
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onSkip} className="flex-1 text-muted-foreground hover:text-foreground text-sm">
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
    <div className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-purple-500/20 rounded-xl p-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
            Family Name
          </label>
          <input
            type="text"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Johnson Family"
            className="w-full p-2.5 border-2 border-purple-500/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-card text-foreground font-medium text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1.5">
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
                  className="flex-1 p-2 border-2 border-purple-500/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-card text-foreground font-medium text-sm"
                />
                <select
                  value={member.relationship}
                  onChange={(e) => updateMember(index, "relationship", e.target.value)}
                  className="p-2 border-2 border-purple-500/20 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-card text-foreground font-medium text-sm"
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
            className="w-full mt-2 border-2 border-dashed border-purple-300 hover:border-purple-400 hover:bg-purple-500/10 text-purple-700 font-semibold text-sm py-2"
          >
            + Add Family Member
          </Button>
        </div>
      </div>
    </div>
  );
};

const AgentSelectionStep: React.FC<{
  selectedAgents: string[];
  onAgentsChange: (agents: string[]) => void;
  isOptional?: boolean;
}> = ({ selectedAgents, onAgentsChange, isOptional }) => {
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
                : "border-purple-500/20 bg-card hover:border-purple-400 hover:bg-purple-500/10"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-1">{agent.emoji}</div>
              <h3 className="font-bold text-xs text-foreground mb-0.5">{agent.name}</h3>
              <p className="text-[10px] text-foreground leading-tight">{agent.specialty}</p>

              {selectedAgents.includes(agent.id) && (
                <div className="mt-1 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-purple-600" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {isOptional && (
        <div className="text-center text-xs text-muted-foreground bg-gray-500/10 border border-gray-500/20 rounded-lg p-2">
          Optional - skip to continue or select agents now
        </div>
      )}
      {!isOptional && (
        <div className="text-center text-xs text-foreground font-medium bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
          Choose 2-3 agents to start with - you can always add more later
        </div>
      )}
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
        <h3 className="text-2xl font-bold text-foreground mb-2">
          You're All Set!
        </h3>
        <p className="text-foreground text-base font-medium mb-4 max-w-lg mx-auto">
          Your family profile is ready. Your AI agents are prepared to help strengthen your family bonds.
        </p>
      </motion.div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-left max-w-lg mx-auto">
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
            className="bg-card rounded-2xl shadow-2xl p-6 mb-4 max-w-sm border border-gray-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h3 className="font-semibold text-foreground">Family Tip</h3>
              </div>
              <button
                onClick={() => setShowGuidance(false)}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                ×
              </button>
            </div>
            <p className="text-muted-foreground mb-4">
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