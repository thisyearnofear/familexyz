/**
 * Family Goals Step Component
 * 
 * Allows users to select family goals to focus on.
 */

import React from "react";
import { CheckCircle } from "lucide-react";
import { FAMILY_GOALS } from "@/lib/constants";

interface FamilyGoalsStepProps {
  selectedGoals: string[];
  onGoalsChange: (goals: string[]) => void;
}

export const FamilyGoalsStep: React.FC<FamilyGoalsStepProps> = ({
  selectedGoals,
  onGoalsChange,
}) => {
  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      onGoalsChange(selectedGoals.filter((id) => id !== goalId));
    } else {
      onGoalsChange([...selectedGoals, goalId]);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {FAMILY_GOALS.map((goal) => (
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
                <h3 className="font-bold text-sm text-gray-900 leading-tight">
                  {goal.label}
                </h3>
                <p className="text-xs text-gray-700 mt-0.5">{goal.description}</p>
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