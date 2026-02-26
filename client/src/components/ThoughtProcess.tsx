import React from "react";
import { Brain, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Thought {
  id: string;
  content: string;
  type: "plan" | "reasoning" | "tool" | "observation";
  status: "pending" | "completed" | "error";
}

interface ThoughtProcessProps {
  thoughts: Thought[];
  isThinking: boolean;
}

export const ThoughtProcess: React.FC<ThoughtProcessProps> = ({ 
  thoughts, 
  isThinking 
}) => {
  if (thoughts.length === 0 && !isThinking) return null;

  return (
    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4 my-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
        <Brain className="w-3.5 h-3.5" />
        <span>Agent Reasoning</span>
        {isThinking && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex gap-1"
          >
            <span className="w-1 h-1 bg-purple-400 rounded-full" />
            <span className="w-1 h-1 bg-purple-400 rounded-full" />
            <span className="w-1 h-1 bg-purple-400 rounded-full" />
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {thoughts.map((thought) => (
            <motion.div
              key={thought.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-start gap-2.5"
            >
              <div className="mt-0.5">
                {thought.status === "completed" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                ) : thought.status === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${
                  thought.status === "completed" ? "text-gray-600" : "text-gray-900 font-medium"
                }`}>
                  {thought.content}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
