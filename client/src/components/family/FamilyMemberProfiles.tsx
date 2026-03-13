import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Users, Plus, Edit, X } from "lucide-react";
import type { FamilyMember } from "@/types/family";
import { MemberDisplayView, MemberEditForm, AddMemberForm } from "./members";

interface FamilyMemberProfilesProps {
  members: FamilyMember[];
  onMembersChange: (members: FamilyMember[]) => void;
  currentUserId?: string;
}

export const FamilyMemberProfiles: React.FC<FamilyMemberProfilesProps> = ({
  members,
  onMembersChange,
  currentUserId,
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
      shareProgress: true,
    },
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
          shareProgress: true,
        },
        contact: newMember.contact,
        notes: newMember.notes,
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
          shareProgress: true,
        },
      });
      setShowAddForm(false);
    }
  };

  const updateMember = (id: string, updates: Partial<FamilyMember>) => {
    onMembersChange(
      members.map((member) => (member.id === id ? { ...member, ...updates } : member))
    );
  };

  const deleteMember = (id: string) => {
    onMembersChange(members.filter((member) => member.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-600" />
            <span>Family Member Profiles</span>
          </h2>
          <p className="text-muted-foreground mt-1">
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
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-semibold">
                            {member.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </Avatar>
                      {member.id === currentUserId && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500/100 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.relationship}</p>
                      {member.age && (
                        <p className="text-xs text-muted-foreground">{member.age} years old</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setEditingMember(editingMember === member.id ? null : member.id)
                    }
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
                  <MemberDisplayView member={member} />
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
              className="bg-card rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-foreground">Add Family Member</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>
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