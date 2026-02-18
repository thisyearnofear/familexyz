/**
 * Welcome Step Component
 * 
 * First step of the family onboarding flow.
 * Introduces the platform and offers tour or skip options.
 */

import React from "react";
import { Button } from "@/components/ui/button";
import { Lightbulb, ArrowRight, BookOpen } from "lucide-react";

interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
  onStartTour?: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  onNext,
  onSkip,
  onStartTour,
}) => {
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
          Strengthen family bonds with AI-powered guidance designed specifically for how your family{" "}
          <span className="font-bold text-purple-700">communicates</span>,{" "}
          <span className="font-bold text-pink-600">grows</span>, and{" "}
          <span className="font-bold text-blue-600">connects</span>.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left mb-6">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center text-sm">
            <Lightbulb className="w-4 h-4 mr-2" />
            Key Features:
          </h4>
          <ul className="space-y-2">
            <li className="flex items-start space-x-2 text-blue-800">
              <span className="text-blue-600 mt-0.5 flex-shrink-0">✓</span>
              <span className="text-sm">Every family is unique - we'll personalize everything for you</span>
            </li>
            <li className="flex items-start space-x-2 text-blue-800">
              <span className="text-blue-600 mt-0.5 flex-shrink-0">✓</span>
              <span className="text-sm">Your privacy and data security are our top priorities</span>
            </li>
            <li className="flex items-start space-x-2 text-blue-800">
              <span className="text-blue-600 mt-0.5 flex-shrink-0">✓</span>
              <span className="text-sm">You can customize your experience at any time</span>
            </li>
          </ul>
        </div>

        <div className="space-y-3 max-w-md mx-auto">
          <p className="text-xs text-gray-600 italic">
            Your family's personalized AI-powered wellness journey starts here
          </p>

          <Button
            onClick={onNext}
            size="lg"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 font-bold text-base shadow-lg hover:shadow-xl transition-all"
          >
            Get Started
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>

          <div className="flex gap-2">
            {onStartTour && (
              <Button
                variant="outline"
                size="sm"
                onClick={onStartTour}
                className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold text-sm"
              >
                <BookOpen className="w-4 h-4 mr-1" />
                Take Tour
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="flex-1 text-gray-600 hover:text-gray-900 text-sm"
            >
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};