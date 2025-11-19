import React from "react";
import { motion } from "framer-motion";
import { ChatInterface } from "@/components/ChatInterface";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Users, Rocket, MessageCircle } from "lucide-react";

interface AgentsTabProps {
  agentsData?: { agents: any[]; total: number };
  selectedAgent: string | null;
  onAgentSelect: (agentId: string) => void;
}

const agentMetadata: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  Wisdom: { icon: <Brain className="w-6 h-6" />, color: "from-purple-500 to-purple-600", description: "Emotional guidance" },
  Intimacy: { icon: <Heart className="w-6 h-6" />, color: "from-pink-500 to-pink-600", description: "Relationship building" },
  GenerationalBridge: { icon: <Users className="w-6 h-6" />, color: "from-blue-500 to-blue-600", description: "Cross-generational" },
  Growth: { icon: <Rocket className="w-6 h-6" />, color: "from-orange-500 to-orange-600", description: "Family challenges" },
};

export const AgentsTab: React.FC<AgentsTabProps> = ({ agentsData, selectedAgent, onAgentSelect }) => {
  return (
    <motion.div
      key="agents"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {agentsData?.agents?.map((agent: any) => {
          const metadata = agentMetadata[agent.name] || { icon: <MessageCircle className="w-6 h-6" />, color: "from-gray-500 to-gray-600", description: "AI Agent" };
          return (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${selectedAgent === agent.id ? "ring-2 ring-purple-500" : ""}`}
              onClick={() => onAgentSelect(agent.id)}
            >
              <CardHeader>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${metadata.color} flex items-center justify-center text-white mb-2`}>
                  {metadata.icon}
                </div>
                <CardTitle>{agent.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{metadata.description}</p>
                <Badge className="mt-2">Active</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedAgent && (
        <div className="mt-6">
          <ChatInterface initialAgentId={selectedAgent} />
        </div>
      )}
    </motion.div>
  );
};
