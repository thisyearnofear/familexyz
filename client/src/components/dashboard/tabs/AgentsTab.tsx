import React, { useState } from "react";
import { motion } from "framer-motion";
import { ChatInterface } from "@/components/ChatInterface";
import { PayoutDashboard } from "@/components/dashboard/payout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Heart, Users, Rocket, MessageCircle, Leaf, Coins, Bot } from "lucide-react";

interface AgentsTabProps {
  agentsData?: { agents: any[]; total: number };
  selectedAgent: string | null;
  onAgentSelect: (agentId: string) => void;
  familyId?: string;
}

const agentMetadata: Record<string, { icon: React.ReactNode; emoji: string; color: string; description: string }> = {
  Wisdom: { icon: <Brain className="w-6 h-6" />, emoji: "🧠", color: "from-purple-500 to-purple-600", description: "Philosophy & Emotional Intelligence" },
  Intimacy: { icon: <Heart className="w-6 h-6" />, emoji: "💖", color: "from-pink-500 to-pink-600", description: "Couple & Family Relationship Coaching" },
  GenerationalBridge: { icon: <Users className="w-6 h-6" />, emoji: "👵👦", color: "from-blue-500 to-blue-600", description: "Cross-Generational Connections" },
  Presence: { icon: <Leaf className="w-6 h-6" />, emoji: "🧘", color: "from-green-500 to-green-600", description: "Mindfulness & Digital Wellness" },
  Growth: { icon: <Rocket className="w-6 h-6" />, emoji: "🚀", color: "from-orange-500 to-orange-600", description: "Shared Family Growth Challenges" },
};

export const AgentsTab: React.FC<AgentsTabProps> = ({ agentsData, selectedAgent, onAgentSelect, familyId = "default" }) => {
  const [showPayouts, setShowPayouts] = useState(false);

  // Debug logging
  console.log('[AgentsTab] Received agentsData:', agentsData);

  // Show loading state
  if (!agentsData) {
    console.log('[AgentsTab] No agentsData, showing loading');
    return (
      <motion.div
        key="agents"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </motion.div>
    );
  }

  // Show empty state
  if (!agentsData.agents || agentsData.agents.length === 0) {
    return (
      <motion.div
        key="agents"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-12"
      >
        <div className="text-center">
          <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Agents Available</h3>
          <p className="text-muted-foreground">Agents will appear here when they are running.</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="agents"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Agent Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {agentsData?.agents?.map((agent: any) => {
          const metadata = agentMetadata[agent.name] || { icon: <MessageCircle className="w-6 h-6" />, emoji: "🤖", color: "from-gray-500 to-gray-600", description: "AI Agent" };
          const isSelected = selectedAgent === agent.id;
          return (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${isSelected ? "ring-2 ring-purple-500 shadow-lg" : ""}`}
              onClick={() => onAgentSelect(agent.id)}
            >
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${metadata.color} flex items-center justify-center text-white mb-2`}>
                  {metadata.icon}
                </div>
                <CardTitle className="text-base">
                  <span className="mr-1">{metadata.emoji}</span>
                  {agent.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground mb-2">{metadata.description}</p>
                <Badge className="bg-green-100 text-green-300 border-green-500/20">Active</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payouts Toggle */}
      {selectedAgent && (
        <div className="flex gap-2">
          <Button
            variant={!showPayouts ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPayouts(false)}
            className={!showPayouts ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            variant={showPayouts ? "default" : "outline"}
            size="sm"
            onClick={() => setShowPayouts(true)}
            className={showPayouts ? "bg-purple-600 hover:bg-purple-700" : ""}
          >
            <Coins className="w-4 h-4 mr-2" />
            Rewards & Payouts
          </Button>
        </div>
      )}

      {/* Agent Content */}
      {selectedAgent && !showPayouts && (
        <div className="mt-2">
          <ChatInterface initialAgentId={selectedAgent} />
        </div>
      )}

      {selectedAgent && showPayouts && (
        <div className="mt-2">
          <PayoutDashboard
            agentId={selectedAgent}
            familyId={familyId}
            agentName={agentsData?.agents?.find((a: any) => a.id === selectedAgent)?.name}
          />
        </div>
      )}
    </motion.div>
  );
};
