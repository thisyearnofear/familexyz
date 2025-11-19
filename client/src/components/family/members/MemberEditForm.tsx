import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import {
  RELATIONSHIP_OPTIONS,
  COMMUNICATION_STYLES,
} from "../constants/familyMemberConstants";

interface MemberEditFormProps {
  member: FamilyMember;
  onUpdate: (updates: Partial<FamilyMember>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export const MemberEditForm: React.FC<MemberEditFormProps> = ({
  member,
  onUpdate,
  onCancel,
  onDelete,
}) => {
  const [formData, setFormData] = useState(member);

  const handleSave = () => {
    onUpdate(formData);
    onCancel();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Age</Label>
          <Input
            type="number"
            value={formData.age || ""}
            onChange={(e) =>
              setFormData({ ...formData, age: parseInt(e.target.value) || undefined })
            }
            className="text-sm"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Relationship</Label>
        <select
          value={formData.relationship}
          onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
          className="w-full p-2 text-sm border border-gray-300 rounded-md"
        >
          {RELATIONSHIP_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-xs">Communication Style</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {COMMUNICATION_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() =>
                setFormData({ ...formData, communicationStyle: style.value as any })
              }
              className={`p-2 text-xs rounded-lg border transition-colors ${
                formData.communicationStyle === style.value
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{style.icon}</div>
                <div className="font-medium">{style.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="destructive" size="sm" onClick={onDelete} className="text-xs">
          Delete
        </Button>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} className="text-xs">
            <Save className="w-3 h-3 mr-1" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};
