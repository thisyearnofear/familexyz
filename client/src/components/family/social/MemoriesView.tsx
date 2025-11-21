import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Camera, Plus } from "lucide-react";

export const MemoriesView: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="text-center py-12">
        <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">Family Memories</h3>
        <p className="text-gray-500 mb-6">
          Capture and share your favorite family moments
        </p>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Memory
        </Button>
      </div>
    </motion.div>
  );
};
