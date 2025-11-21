import React from "react";
import { motion } from "framer-motion";
import { FamilyPost, FamilyMember } from "./types";
import { CreatePostCard } from "./CreatePostCard";
import { PostItem } from "./PostItem";

interface SocialFeedProps {
  posts: FamilyPost[];
  currentUserId: string;
  familyMembers: FamilyMember[];
  onCreatePost: (content: string) => void;
  onLikePost: (postId: string) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({
  posts,
  currentUserId,
  familyMembers,
  onCreatePost,
  onLikePost
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <CreatePostCard
        currentUserId={currentUserId}
        familyMembers={familyMembers}
        onCreatePost={onCreatePost}
      />

      <div className="space-y-4">
        {posts.map((post) => (
          <PostItem
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            familyMembers={familyMembers}
            onLike={onLikePost}
          />
        ))}
      </div>
    </motion.div>
  );
};
