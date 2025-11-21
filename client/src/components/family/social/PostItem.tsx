import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import { FamilyPost, FamilyMember } from "./types";
import { getMemberName, getMemberAvatar, formatTimeAgo } from "./utils";

interface PostItemProps {
  post: FamilyPost;
  currentUserId: string;
  familyMembers: FamilyMember[];
  onLike: (postId: string) => void;
}

export const PostItem: React.FC<PostItemProps> = ({
  post,
  currentUserId,
  familyMembers,
  onLike
}) => {
  const postTypeColors: { [key: string]: { bg: string; border: string; badge: string; icon: string } } = {
    achievement: { bg: "from-amber-50 to-orange-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-800", icon: "text-amber-600" },
    milestone: { bg: "from-green-50 to-emerald-50", border: "border-green-200", badge: "bg-green-100 text-green-800", icon: "text-green-600" },
    memory: { bg: "from-purple-50 to-pink-50", border: "border-purple-200", badge: "bg-purple-100 text-purple-800", icon: "text-purple-600" },
    challenge: { bg: "from-blue-50 to-indigo-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-800", icon: "text-blue-600" },
    gratitude: { bg: "from-rose-50 to-pink-50", border: "border-rose-200", badge: "bg-rose-100 text-rose-800", icon: "text-rose-600" }
  };
  const colors = postTypeColors[post.type] || postTypeColors.memory;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <Card className={`bg-gradient-to-r ${colors.bg} border ${colors.border} shadow-sm hover:shadow-md transition-all`}>
        <CardContent className="p-5">
          <div className="flex space-x-3">
            <Avatar className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-400 flex-shrink-0 border-2 border-white shadow-sm">
              {getMemberAvatar(familyMembers, post.author) ? (
                <img src={getMemberAvatar(familyMembers, post.author)} alt={getMemberName(familyMembers, post.author)} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {getMemberName(familyMembers, post.author).charAt(0)}
                </span>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm">
                  {getMemberName(familyMembers, post.author)}
                </span>
                <Badge className={`text-xs font-medium ${colors.badge}`}>
                  {post.type.charAt(0).toUpperCase() + post.type.slice(1)}
                </Badge>
                <span className="text-xs text-gray-600 font-medium">
                  {formatTimeAgo(post.timestamp)}
                </span>
              </div>
              <p className="text-gray-800 mb-3 text-sm leading-relaxed font-medium">{post.content}</p>

              {/* Post Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="text-xs bg-white bg-opacity-60 text-gray-700 font-medium border border-gray-200"
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Agent Reactions */}
              {post.agentReactions && post.agentReactions.length > 0 && (
                <div className="bg-white bg-opacity-60 backdrop-blur-sm p-3 rounded-lg mb-3 border border-purple-200">
                  <div className="flex items-start gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-purple-700">AI Team:</span>
                    {post.agentReactions.map((reaction, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-purple-50 px-2 py-1 rounded-md">
                        <span className="text-sm">{reaction.agentEmoji}</span>
                        <span className="text-xs font-medium text-gray-800">"{reaction.reaction}"</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center space-x-6 pt-3 border-t border-white border-opacity-40">
                <button
                  onClick={() => onLike(post.id)}
                  className={`flex items-center space-x-1.5 transition-colors text-xs font-medium ${
                    post.likes.includes(currentUserId)
                      ? "text-red-600"
                      : "text-gray-600 hover:text-red-600"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${post.likes.includes(currentUserId) ? "fill-current" : ""}`} />
                  <span>{post.likes.length}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 transition-colors text-xs font-medium">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments.length}</span>
                </button>
                <button className="flex items-center space-x-1.5 text-gray-600 hover:text-green-600 transition-colors text-xs font-medium">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
