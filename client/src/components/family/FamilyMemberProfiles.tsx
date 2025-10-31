import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import {
  Users,
  Plus,
  Edit,
  Save,
  X,
  Camera,
  Heart,
  Star,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Cake,
  Gamepad2,
  Book,
  Music,
  Palette,
  Trophy,
  Target,
  Clock,
  Shield
} from "lucide-react";

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  birthday?: string;
  avatar?: string;
  interests: string[];
  favoriteActivities: string[];
  communicationStyle: "visual" | "auditory" | "kinesthetic";
  personalityTraits: string[];
  goals: string[];
  preferences: {
    notifications: boolean;
    privacy: "open" | "moderate" | "private";
    shareProgress: boolean;
  };
  contact?: {
    email?: string;
    phone?: string;
  };
  notes?: string;
}

interface FamilyMemberProfilesProps {
  members: FamilyMember[];
  onMembersChange: (members: FamilyMember[]) => void;
  currentUserId?: string;
}

const RELATIONSHIP_OPTIONS = [
  "Parent", "Child", "Teen", "Grandparent", "Sibling",
  "Spouse", "Partner", "Guardian", "Other"
];

const INTEREST_SUGGESTIONS = [
  "Reading", "Sports", "Music", "Art", "Gaming", "Cooking",
  "Gardening", "Technology", "Travel", "Photography", "Dancing",
  "Writing", "Science", "Nature", "Movies", "Crafts"
];

const PERSONALITY_TRAITS = [
  "Creative", "Analytical", "Empathetic", "Adventurous", "Calm",
  "Energetic", "Thoughtful", "Humorous", "Organized", "Spontaneous",
  "Patient", "Curious", "Supportive", "Independent", "Social"
];

const COMMUNICATION_STYLES = [
  { value: "visual", label: "Visual", desc: "Learns through seeing and images", icon: "👁️" },
  { value: "auditory", label: "Auditory", desc: "Learns through hearing and discussion", icon: "👂" },
  { value: "kinesthetic", label: "Kinesthetic", desc: "Learns through doing and movement", icon: "🤲" }
];

export const FamilyMemberProfiles: React.FC<FamilyMemberProfilesProps> = ({
  members,
  onMembersChange,
  currentUserId
}) => {
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    name: "",
    relationship: "Child",
    interests: [],
    favoriteActivities: [],
    communicationStyle: "visual",
    personalityTraits: [],
    goals: [],
    preferences: {
      notifications: true,
      privacy: "moderate",
      shareProgress: true
    }
  });

  const addMember = () => {
    if (newMember.name?.trim()) {
      const member: FamilyMember = {
        id: Date.now().toString(),
        name: newMember.name,
        relationship: newMember.relationship || "Child",
        age: newMember.age,
        birthday: newMember.birthday,
        interests: newMember.interests || [],
        favoriteActivities: newMember.favoriteActivities || [],
        communicationStyle: newMember.communicationStyle || "visual",
        personalityTraits: newMember.personalityTraits || [],
        goals: newMember.goals || [],
        preferences: newMember.preferences || {
          notifications: true,
          privacy: "moderate",
          shareProgress: true
        },
        contact: newMember.contact,
        notes: newMember.notes
      };

      onMembersChange([...members, member]);
      setNewMember({
        name: "",
        relationship: "Child",
        interests: [],
        favoriteActivities: [],
        communicationStyle: "visual",
        personalityTraits: [],
        goals: [],
        preferences: {
          notifications: true,
          privacy: "moderate",
          shareProgress: true
        }
      });
      setShowAddForm(false);
    }
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    onMembersChange(members.map(member =>
      member.id === id ? { ...member, ...updates } : member
    ));
  };

  const deleteMember = (id: string) => {
    onMembersChange(members.filter(member => member.id !== id));
  };

  const toggleInterest = (memberId: string, interest: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const interests = member.interests.includes(interest)
        ? member.interests.filter(i => i !== interest)
        : [...member.interests, interest];
      updateMember(memberId, { interests });
    }
  };

  const toggleTrait = (memberId: string, trait: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const traits = member.personalityTraits.includes(trait)
        ? member.personalityTraits.filter(t => t !== trait)
        : [...member.personalityTraits, trait];
      updateMember(memberId, { personalityTraits: traits });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Family Member Profiles</span>
          </h2>
          <p className="text-gray-600 mt-1">
            Personalize each family member's experience and preferences
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Family Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <motion.div
            key={member.id}
            layout
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Avatar>
                      {member.id === currentUserId && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{member.name}</h3>
                      <p className="text-sm text-gray-600">{member.relationship}</p>
                      {member.age && (
                        <p className="text-xs text-gray-500">{member.age} years old</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingMember(editingMember === member.id ? null : member.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {editingMember === member.id ? (
                  <MemberEditForm
                    member={member}
                    onUpdate={(updates) => updateMember(member.id, updates)}
                    onCancel={() => setEditingMember(null)}
                    onDelete={() => deleteMember(member.id)}
                  />
                ) : (
                  <MemberDisplayView
                    member={member}
                    onToggleInterest={(interest) => toggleInterest(member.id, interest)}
                    onToggleTrait={(trait) => toggleTrait(member.id, trait)}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Add Family Member</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddForm(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <AddMemberForm
                member={newMember}
                onUpdate={setNewMember}
                onSave={addMember}
                onCancel={() => setShowAddForm(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MemberDisplayView: React.FC<{
  member: FamilyMember;
  onToggleInterest: (interest: string) => void;
  onToggleTrait: (trait: string) => void;
}> = ({ member }) => {
  return (
    <div className="space-y-3">
      {/* Communication Style */}
      <div>
        <Label className="text-xs font-medium text-gray-600">Communication Style</Label>
        <div className="mt-1">
          <Badge variant="secondary" className="text-xs">
            {COMMUNICATION_STYLES.find(s => s.value === member.communicationStyle)?.icon}{" "}
            {COMMUNICATION_STYLES.find(s => s.value === member.communicationStyle)?.label}
          </Badge>
        </div>
      </div>

      {/* Interests */}
      {member.interests.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-gray-600">Interests</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {member.interests.slice(0, 4).map((interest) => (
              <Badge key={interest} variant="outline" className="text-xs">
                {interest}
              </Badge>
            ))}
            {member.interests.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{member.interests.length - 4} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Personality Traits */}
      {member.personalityTraits.length > 0 && (
        <div>
          <Label className="text-xs font-medium text-gray-600">Personality</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {member.personalityTraits.slice(0, 3).map((trait) => (
              <Badge key={trait} variant="secondary" className="text-xs">
                {trait}
              </Badge>
            ))}
            {member.personalityTraits.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{member.personalityTraits.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Privacy Settings */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600">Privacy</span>
        <div className="flex items-center space-x-1">
          <Shield className="w-3 h-3 text-gray-400" />
          <span className="capitalize text-gray-700">{member.preferences.privacy}</span>
        </div>
      </div>
    </div>
  );
};

const MemberEditForm: React.FC<{
  member: FamilyMember;
  onUpdate: (updates: Partial<FamilyMember>) => void;
  onCancel: () => void;
  onDelete: () => void;
}> = ({ member, onUpdate, onCancel, onDelete }) => {
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
            onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
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
          {RELATIONSHIP_OPTIONS.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>

      <div>
        <Label className="text-xs">Communication Style</Label>
        <div className="grid grid-cols-3 gap-2 mt-1">
          {COMMUNICATION_STYLES.map(style => (
            <button
              key={style.value}
              onClick={() => setFormData({ ...formData, communicationStyle: style.value as any })}
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
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="text-xs"
        >
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

const AddMemberForm: React.FC<{
  member: Partial<FamilyMember>;
  onUpdate: (member: Partial<FamilyMember>) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ member, onUpdate, onSave, onCancel }) => {
  const toggleInterest = (interest: string) => {
    const interests = member.interests || [];
    const newInterests = interests.includes(interest)
      ? interests.filter(i => i !== interest)
      : [...interests, interest];
    onUpdate({ ...member, interests: newInterests });
  };

  const toggleTrait = (trait: string) => {
    const traits = member.personalityTraits || [];
    const newTraits = traits.includes(trait)
      ? traits.filter(t => t !== trait)
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
            {RELATIONSHIP_OPTIONS.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Age</Label>
          <Input
            type="number"
            value={member.age || ""}
            onChange={(e) => onUpdate({ ...member, age: parseInt(e.target.value) || undefined })}
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
          {COMMUNICATION_STYLES.map(style => (
            <button
              key={style.value}
              onClick={() => onUpdate({ ...member, communicationStyle: style.value as any })}
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
          {INTEREST_SUGGESTIONS.map(interest => (
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
          {PERSONALITY_TRAITS.map(trait => (
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
              onChange={(e) => onUpdate({
                ...member,
                preferences: { ...member.preferences, notifications: e.target.checked } as any
              })}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Share progress with family</span>
            <input
              type="checkbox"
              checked={member.preferences?.shareProgress ?? true}
              onChange={(e) => onUpdate({
                ...member,
                preferences: { ...member.preferences, shareProgress: e.target.checked } as any
              })}
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