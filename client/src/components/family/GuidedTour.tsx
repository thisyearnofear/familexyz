import React, { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  Lightbulb,
  Heart,
  Users,
  Target,
  Sparkles,
  Trophy,
  ArrowUpRight
} from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  tips: string[];
  duration?: number;
}

interface GuidedTourProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ onComplete, onSkip }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const tourSteps: TourStep[] = [
    {
      id: "welcome",
      title: "Welcome to Your Family Journey",
      description: "Strengthen family bonds with AI-powered guidance designed specifically for how your family communicates, grows, and connects.",
      icon: <Heart className="w-8 h-8 text-red-500" />,
      highlight: "AI-powered family wellness platform",
      tips: [
        "Every family is unique - we'll personalize everything for you",
        "Your privacy and data security are our top priorities",
        "You can customize your experience at any time"
      ],
      duration: 30
    },
    {
      id: "family-profiles",
      title: "Family Member Profiles",
      description: "Build rich profiles for each family member to unlock personalized activities, recommendations, and communication tailored to their unique interests and style.",
      icon: <Users className="w-8 h-8 text-blue-500" />,
      highlight: "Personalized for each family member",
      tips: [
        "Add interests, hobbies, and personality traits",
        "Choose communication styles (visual, auditory, kinesthetic)",
        "Set privacy preferences for each member"
      ],
      duration: 45
    },
    {
      id: "ai-agents",
      title: "Your AI Family Team",
      description: "Five specialized AI coaches ready to guide you: 🧠 Wisdom for emotional clarity, 💑 Intimacy for relationships, 👵👦 Bridge for generations, 🧘 Presence for mindfulness, 🚀 Growth for challenges.",
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      highlight: "5 specialized AI family coaches",
      tips: [
        "Each agent has unique expertise and personality",
        "Chat with agents individually or in group sessions",
        "Agents learn and adapt to your family's needs"
      ],
      duration: 60
    },
    {
      id: "activities",
      title: "Personalized Activities",
      description: "Experience activities and challenges that evolve with your family—designed around your goals, interests, and the unique dynamics that make your family special.",
      icon: <Target className="w-8 h-8 text-green-500" />,
      highlight: "Activities that grow with your family",
      tips: [
        "Activities adapt based on your family's progress",
        "Mix of bonding, communication, and growth activities",
        "Track completion and celebrate achievements"
      ],
      duration: 40
    },
    {
      id: "social-features",
      title: "Family Social Hub",
      description: "Celebrate victories, collaborate on challenges, and build shared memories in a private space designed exclusively for your family.",
      icon: <Trophy className="w-8 h-8 text-yellow-500" />,
      highlight: "Private family social network",
      tips: [
        "Share family moments and achievements",
        "Collaborate on family challenges and goals",
        "Build family traditions and memories"
      ],
      duration: 35
    },
    {
      id: "insights",
      title: "Family Insights & Growth",
      description: "Watch your family thrive with AI-powered insights into emotional health, communication patterns, and meaningful growth—backed by personalized recommendations.",
      icon: <Lightbulb className="w-8 h-8 text-orange-500" />,
      highlight: "Data-driven family wellness",
      tips: [
        "Monitor family bond strength and communication",
        "Receive personalized improvement suggestions",
        "Celebrate progress and milestones together"
      ],
      duration: 50
    }
  ];

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep]);
      setCurrentStep(currentStep + 1);
    } else {
      setCompletedSteps([...completedSteps, currentStep]);
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const restartTour = () => {
    setCurrentStep(0);
    setCompletedSteps([]);
    setIsPlaying(false);
  };

  const currentTourStep = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>

      <div className="relative h-full flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl mx-auto shadow-2xl border-0">
          <CardContent className="p-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Play className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Family Platform Tour</h1>
                    <p className="text-white/80 text-sm">Discover how FamilyXYZ works</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={restartTour}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={onSkip}
                    className="text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-white/90 mb-2">
                  <span>Step {currentStep + 1} of {tourSteps.length}</span>
                  <span>{Math.round(progress)}% Complete</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center justify-center space-x-3">
                {/* Prev Button */}
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className="p-1.5 rounded-full bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-purple-600"
                    aria-label="Previous step"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-center space-x-2">
                  {tourSteps.map((step, index: number) => (
                    <button
                      key={step.id}
                      onClick={() => goToStep(index)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                        index === currentStep
                          ? "bg-purple-600 text-white scale-110 shadow-md"
                          : completedSteps.includes(index)
                          ? "bg-green-500 text-white hover:bg-green-600"
                          : index < currentStep
                          ? "bg-purple-200 text-purple-700 hover:bg-purple-300"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {completedSteps.includes(index) ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        index + 1
                      )}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <button
                    onClick={nextStep}
                    disabled={currentStep === tourSteps.length - 1}
                    className="p-1.5 rounded-full bg-purple-100 hover:bg-purple-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-purple-600"
                    aria-label="Next step"
                >
                    <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Step Content */}
            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Step Header */}
                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl">
                        {currentTourStep.icon}
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                      {currentTourStep.title}
                    </h2>
                    {currentTourStep.highlight && (
                      <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        {currentTourStep.highlight}
                      </Badge>
                    )}
                    <p className="text-gray-100 text-lg max-w-2xl mx-auto font-medium">
                      {currentTourStep.description}
                    </p>
                  </div>

                  {/* Key Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Key Features:
                    </h3>
                    <ul className="space-y-2">
                      {currentTourStep.tips.map((tip, index: number) => (
                        <li key={index} className="flex items-start space-x-2 text-blue-800">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactive Demo Area */}
                  <div className="bg-gradient-to-r from-gray-50 to-purple-50 border-2 border-dashed border-purple-200 rounded-xl p-8">
                    <div className="text-center">
                      <div className="text-4xl mb-4">
                        {currentStep === 0 && "👨‍👩‍👧‍👦"}
                        {currentStep === 1 && "👤"}
                        {currentStep === 2 && "🤖"}
                        {currentStep === 3 && "🎯"}
                        {currentStep === 4 && "🏆"}
                        {currentStep === 5 && "📊"}
                      </div>
                      <p className="text-gray-600 mb-4">
                        {currentStep === 0 && "Your family's personalized AI-powered wellness journey starts here"}
                        {currentStep === 1 && "Each family member gets a tailored experience"}
                        {currentStep === 2 && "5 specialized AI agents ready to help your family grow"}
                        {currentStep === 3 && "Activities that adapt to your family's unique needs"}
                        {currentStep === 4 && "Celebrate achievements and build lasting memories"}
                        {currentStep === 5 && "Track progress and discover insights about your family"}
                      </p>
                      {currentStep === tourSteps.length - 1 && (
                        <Button
                          onClick={() => {
                            onComplete();
                            navigate("/dashboard");
                          }}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                        >
                          Go to Dashboard
                          <ArrowUpRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center p-6 bg-gray-50 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {currentTourStep.duration && `~${currentTourStep.duration} seconds`}
                </span>
                <Button
                  variant="outline"
                  onClick={onSkip}
                >
                  Skip Tour
                </Button>
              </div>

              <Button
                onClick={nextStep}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <span>{currentStep === tourSteps.length - 1 ? "Start Journey" : "Next"}</span>
                {currentStep === tourSteps.length - 1 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};