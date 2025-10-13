import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, MessageCircle, Heart, Users, Sparkles } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  showAction?: boolean;
  variant?: "default" | "chat" | "agents" | "insights" | "platforms";
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText = "Get Started",
  onAction,
  showAction = true,
  variant = "default",
  className = "",
}) => {
  const getVariantIcon = () => {
    switch (variant) {
      case "chat":
        return <MessageCircle className="w-12 h-12 text-purple-500" />;
      case "agents":
        return <Bot className="w-12 h-12 text-blue-500" />;
      case "insights":
        return <Sparkles className="w-12 h-12 text-yellow-500" />;
      case "platforms":
        return <Users className="w-12 h-12 text-green-500" />;
      default:
        return <Heart className="w-12 h-12 text-pink-500" />;
    }
  };

  const getVariantColor = () => {
    switch (variant) {
      case "chat":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "agents":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "insights":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "platforms":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-pink-600 bg-pink-50 border-pink-200";
    }
  };

  return (
    <Card className={`p-8 text-center ${className}`}>
      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${getVariantColor()}`}>
        {icon || getVariantIcon()}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      
      {showAction && onAction && actionText && (
        <Button 
          onClick={onAction}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {actionText}
        </Button>
      )}
    </Card>
  );
};

// Specific empty state components
export const ChatEmptyState: React.FC<{
  onGetStarted?: () => void;
}> = ({ onGetStarted }) => (
  <EmptyState
    variant="chat"
    title="Start Your Family Conversation"
    description="Connect with your family agents to strengthen bonds, share experiences, and create lasting memories together."
    actionText="Choose an Agent"
    onAction={onGetStarted}
  />
);

export const AgentsEmptyState: React.FC<{
  onGetStarted?: () => void;
}> = ({ onGetStarted }) => (
  <EmptyState
    variant="agents"
    title="No Agents Available"
    description="It looks like there are no family agents configured for your account yet. Agents help strengthen your family bonds."
    actionText="Configure Agents"
    onAction={onGetStarted}
  />
);

export const InsightsEmptyState: React.FC<{
  onGetStarted?: () => void;
}> = ({ onGetStarted }) => (
  <EmptyState
    variant="insights"
    title="Personalized Insights Coming Soon"
    description="Your family insights dashboard will show detailed analytics and recommendations based on your family interactions."
    actionText="Start Chatting"
    onAction={onGetStarted}
  />
);

export const PlatformsEmptyState: React.FC<{
  onGetStarted?: () => void;
}> = ({ onGetStarted }) => (
  <EmptyState
    variant="platforms"
    title="Connect Family Platforms"
    description="Integrate your family communication platforms to extend your AI agents' reach across all your family channels."
    actionText="Connect Platforms"
    onAction={onGetStarted}
  />
);

// Onboarding flow components
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export const OnboardingFlow: React.FC<{
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  showProgress?: boolean;
}> = ({ steps, currentStep, onNext, onBack, onComplete, showProgress = true }) => {
  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  return (
    <Card className="p-8 max-w-2xl mx-auto">
      {showProgress && (
        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            {steps.map((_, index) => (
              <React.Fragment key={index}>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                    index <= currentStep 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1 <= currentStep ? "✓" : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-1 rounded-full transition-all duration-300 ${
                      index + 1 <= currentStep
                        ? "bg-gradient-to-r from-purple-500 to-pink-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
          {currentStepData.icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {currentStepData.title}
        </h2>
        <p className="text-gray-600">
          {currentStepData.description}
        </p>
      </div>

      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={currentStep === 0}
          className="flex items-center space-x-2"
        >
          <span>← Back</span>
        </Button>

        <div className="text-sm text-gray-500">
          Step {currentStep + 1} of {steps.length}
        </div>

        <Button
          onClick={isLastStep ? onComplete : onNext}
          className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <span>
            {isLastStep ? "Get Started" : "Continue"}
          </span>
          {!isLastStep && <MessageCircle className="w-4 h-4" />}
        </Button>
      </div>
    </Card>
  );
};