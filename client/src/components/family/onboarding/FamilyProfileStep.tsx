/**
 * Family Profile Step Component
 * 
 * Collects family name and member information.
 */

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FamilyMember {
  name: string;
  relationship: string;
  age?: number;
  interests?: string[];
  avatar?: string;
}

interface FamilyProfile {
  name: string;
  members: FamilyMember[];
}

interface FamilyProfileStepProps {
  profile: FamilyProfile;
  onUpdate: (profile: FamilyProfile) => void;
}

export const FamilyProfileStep: React.FC<FamilyProfileStepProps> = ({
  profile,
  onUpdate,
}) => {
  const [familyName, setFamilyName] = useState(profile.name);
  const [members, setMembers] = useState<FamilyMember[]>(
    profile.members.length > 0 ? profile.members : [{ name: "", relationship: "Parent" }]
  );

  const addMember = () => {
    setMembers([...members, { name: "", relationship: "Child" }]);
  };

  const updateMember = (index: number, field: string, value: string) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], [field]: value };
    setMembers(newMembers);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    onUpdate({ name: familyName, members });
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
            {members.map((member, index) => (
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
                {members.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(index)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    ✕
                  </Button>
                )}
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