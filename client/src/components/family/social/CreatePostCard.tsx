import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Camera, Trophy, Send } from "lucide-react";
import { FamilyMember } from "./types";
import { getMemberName, getMemberAvatar } from "./utils";

interface CreatePostCardProps {
  currentUserId: string;
  familyMembers: FamilyMember[];
  onCreatePost: (content: string) => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  currentUserId,
  familyMembers,
  onCreatePost
}) => {
  const [newPost, setNewPost] = useState("");

  const handleCreatePost = () => {
    if (newPost.trim()) {
      onCreatePost(newPost);
      setNewPost("");
    }
  };

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 shadow-sm">
      <CardContent className="p-5">
        <div className="flex space-x-4">
          <Avatar className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 flex-shrink-0 border-2 border-white shadow-sm">
            {getMemberAvatar(familyMembers, currentUserId) ? (
              <img src={getMemberAvatar(familyMembers, currentUserId)} alt="You" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">
                {getMemberName(familyMembers, currentUserId).charAt(0) || "U"}
              </span>
            )}
          </Avatar>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Posting as {getMemberName(familyMembers, currentUserId) || "Family Member"}
              </p>
              <Textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share a family moment, achievement, or thought..."
                rows={3}
                className="border-purple-200 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="bg-white border-2 border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Photo
                </Button>
                <Button
                  size="sm"
                  className="bg-white border-2 border-purple-400 hover:bg-purple-50 text-purple-700 font-semibold"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Achievement
                </Button>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={!newPost.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-medium"
              >
                <Send className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
