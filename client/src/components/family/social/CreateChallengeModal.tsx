import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Gift } from "lucide-react";
import { CreateChallengeData } from "./types";

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CreateChallengeData) => void;
}

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({
  isOpen,
  onClose,
  onCreate
}) => {
  const [newChallenge, setNewChallenge] = useState<CreateChallengeData>({
    title: "",
    description: "",
    category: "",
    duration: "",
    target: 7,
    reward: ""
  });

  const handleCreate = () => {
    if (!newChallenge.title || !newChallenge.description) return;
    onCreate(newChallenge);
    setNewChallenge({
      title: "",
      description: "",
      category: "",
      duration: "",
      target: 7,
      reward: ""
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50 to-emerald-50">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-green-600" />
                Create Family Challenge
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Challenge Title</label>
                <Input
                  placeholder="e.g., Daily Gratitude, No Screen Sunday"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                  className="border-gray-200 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <Textarea
                  placeholder="What's the goal? How do we track it?"
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                  className="border-gray-200 focus:ring-green-500 focus:border-green-500 min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Duration (Days)</label>
                  <Input
                    type="number"
                    placeholder="7"
                    value={newChallenge.duration}
                    onChange={(e) => setNewChallenge({ ...newChallenge, duration: e.target.value })}
                    className="border-gray-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Target Count</label>
                  <Input
                    type="number"
                    placeholder="e.g., 7"
                    value={newChallenge.target}
                    onChange={(e) => setNewChallenge({ ...newChallenge, target: parseInt(e.target.value) || 0 })}
                    className="border-gray-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <div className="flex flex-wrap gap-2">
                  {["bonding", "health", "learning", "kindness"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setNewChallenge({ ...newChallenge, category: cat })}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        newChallenge.category === cat
                          ? "bg-green-100 text-green-800 border-2 border-green-200"
                          : "bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200"
                      }`}
                    >
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reward (Optional)</label>
                <div className="relative">
                  <Gift className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="e.g., Pizza Night, Movie Choice"
                    value={newChallenge.reward}
                    onChange={(e) => setNewChallenge({ ...newChallenge, reward: e.target.value })}
                    className="pl-9 border-gray-200 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newChallenge.title || !newChallenge.description}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                Create Challenge
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
