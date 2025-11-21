import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageCircle, Gift } from "lucide-react";
import { FamilyChallenge, FamilyMember } from "./types";
import { getMemberName } from "./utils";

interface ChallengeCardProps {
  challenge: FamilyChallenge;
  familyMembers: FamilyMember[];
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, familyMembers }) => {
  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 hover:shadow-lg transition-shadow">
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
                  <span className="font-semibold text-gray-900">{getMemberName(familyMembers, participantId)}</span>
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
            Created by {getMemberName(familyMembers, challenge.createdBy)}
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
  );
};
