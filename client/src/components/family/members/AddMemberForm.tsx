import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import {
  RELATIONSHIP_OPTIONS,
  INTEREST_SUGGESTIONS,
  PERSONALITY_TRAITS,
  COMMUNICATION_STYLES,
} from "../constants/familyMemberConstants";

interface AddMemberFormProps {
  member: Partial<FamilyMember>;
  onUpdate: (member: Partial<FamilyMember>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  member,
  onUpdate,
  onSave,
  onCancel,
}) => {
  const toggleInterest = (interest: string) => {
    const interests = member.interests || [];
    const newInterests = interests.includes(interest)
      ? interests.filter((i) => i !== interest)
      : [...interests, interest];
    onUpdate({ ...member, interests: newInterests });
  };

  const toggleTrait = (trait: string) => {
    const traits = member.personalityTraits || [];
    const newTraits = traits.includes(trait)
      ? traits.filter((t) => t !== trait)
      : [...traits, trait];
    onUpdate({ ...member, personalityTraits: newTraits });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Name *</Label>
          <Input
            value={member.name || ""}
            onChange={(e) => onUpdate({ ...member, name: e.target.value })}
            placeholder="Enter name"
          />
        </div>
        <div>
          <Label>Relationship</Label>
          <select
            value={member.relationship || "Child"}
            onChange={(e) => onUpdate({ ...member, relationship: e.target.value })}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {RELATIONSHIP_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Age</Label>
          <Input
            type="number"
            value={member.age || ""}
            onChange={(e) =>
              onUpdate({ ...member, age: parseInt(e.target.value) || undefined })
            }
            placeholder="Age"
          />
        </div>
        <div>
          <Label>Birthday</Label>
          <Input
            type="date"
            value={member.birthday || ""}
            onChange={(e) => onUpdate({ ...member, birthday: e.target.value })}
          />
        </div>
      </div>

      {/* Communication Style */}
      <div>
        <Label className="mb-3 block">Communication Style</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COMMUNICATION_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() =>
                onUpdate({ ...member, communicationStyle: style.value as any })
              }
              className={`p-4 rounded-lg border-2 transition-colors ${
                member.communicationStyle === style.value
                  ? "border-purple-500 bg-purple-50"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{style.icon}</div>
                <div className="font-semibold text-gray-800">{style.label}</div>
                <div className="text-xs text-gray-600 mt-1">{style.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <Label className="mb-3 block">Interests & Hobbies</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {INTEREST_SUGGESTIONS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                member.interests?.includes(interest)
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Personality Traits */}
      <div>
        <Label className="mb-3 block">Personality Traits</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PERSONALITY_TRAITS.map((trait) => (
            <button
              key={trait}
              onClick={() => toggleTrait(trait)}
              className={`p-2 text-sm rounded-lg border transition-colors ${
                member.personalityTraits?.includes(trait)
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 hover:border-green-300"
              }`}
            >
              {trait}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Preferences */}
      <div>
        <Label className="mb-3 block">Privacy Preferences</Label>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Receive notifications</span>
            <input
              type="checkbox"
              checked={member.preferences?.notifications ?? true}
              onChange={(e) =>
                onUpdate({
                  ...member,
                  preferences: {
                    ...member.preferences,
                    notifications: e.target.checked,
                  } as any,
                })
              }
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Share progress with family</span>
            <input
              type="checkbox"
              checked={member.preferences?.shareProgress ?? true}
              onChange={(e) =>
                onUpdate({
                  ...member,
                  preferences: {
                    ...member.preferences,
                    shareProgress: e.target.checked,
                  } as any,
                })
              }
              className="rounded"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label>Additional Notes</Label>
        <Textarea
          value={member.notes || ""}
          onChange={(e) => onUpdate({ ...member, notes: e.target.value })}
          placeholder="Any special considerations, preferences, or notes about this family member..."
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={!member.name?.trim()}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>
    </div>
  );
};
