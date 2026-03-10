import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Brain, Heart, Users, Leaf, Rocket, Info, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { ThoughtProcess } from "./ThoughtProcess";
import { motion, AnimatePresence } from "framer-motion";
import { useFamilyTools, type PendingToolCall } from "@/hooks/useFamilyTools";
import type { AGUIEvent } from "@/types/agui";

interface Message {
  id: string;
  content: string;
  sender: "user" | "agent" | "system";
  agentName?: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface Thought {
  id: string;
  content: string;
  type: "plan" | "reasoning" | "tool" | "observation";
  status: "pending" | "completed" | "error";
}

interface Agent {
  id: string;
  name: string;
  description: string;
  color: string;
}

const agentConfigs: Record<string, any> = {
  Wisdom: { icon: <Brain className="w-4 h-4" />, color: "bg-purple-500" },
  Intimacy: { icon: <Heart className="w-4 h-4" />, color: "bg-pink-500" },
  GenerationalBridge: { icon: <Users className="w-4 h-4" />, color: "bg-blue-500" },
  Presence: { icon: <Leaf className="w-4 h-4" />, color: "bg-green-500" },
  Growth: { icon: <Rocket className="w-4 h-4" />, color: "bg-orange-500" },
};

// ── Tool Approval Dialog ───────────────────────────────
const ToolApprovalCard: React.FC<{
  call: PendingToolCall;
  onApprove: (toolCallId: string) => void;
  onReject: (toolCallId: string) => void;
}> = ({ call, onApprove, onReject }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-3 space-y-3"
  >
    <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
      <Loader2 className="w-4 h-4 animate-spin" />
      Agent wants to run: <span className="font-mono text-amber-900">{call.toolName}</span>
    </div>
    <pre className="text-xs bg-white/70 rounded-lg p-3 overflow-x-auto text-gray-700">
      {JSON.stringify(call.args, null, 2)}
    </pre>
    <div className="flex gap-2">
      <button
        onClick={() => onApprove(call.toolCallId)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
      >
        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
      </button>
      <button
        onClick={() => onReject(call.toolCallId)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        <XCircle className="w-3.5 h-3.5" /> Reject
      </button>
    </div>
  </motion.div>
);

// ── Step Progress Indicator ────────────────────────────
const StepProgress: React.FC<{ steps: { name: string; done: boolean }[] }> = ({ steps }) => {
  if (steps.length === 0) return null;
  return (
    <div className="flex items-center gap-3 px-2 py-1 text-xs text-gray-500">
      {steps.map((s) => (
        <span key={s.name} className={`flex items-center gap-1 ${s.done ? "text-green-600" : "text-purple-600 font-medium"}`}>
          {s.done ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
          {s.name}
        </span>
      ))}
    </div>
  );
};

export const AGUIChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [bondScore, setBondScore] = useState<number | null>(null);
  const [agentSnapshot, setAgentSnapshot] = useState<Record<string, unknown> | null>(null);
  const [activeSteps, setActiveSteps] = useState<{ name: string; done: boolean }[]>([]);

  // Accumulates streamed tool-call JSON args keyed by toolCallId
  const toolArgsBufferRef = useRef<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { tools, pendingToolCalls, enqueueToolCall, resolveToolCall, clearPendingToolCalls } = useFamilyTools();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, thoughts, pendingToolCalls]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        const response = await apiClient.getAgents();
        const loadedAgents = (response.agents || []).map((a: any) => ({
          id: a.id || a.agentId,
          name: a.name || a.id,
          description: agentConfigs[a.name]?.description || "Family Agent",
          color: agentConfigs[a.name]?.color || "bg-gray-500",
        }));
        setAgents(loadedAgents);
        if (loadedAgents.length > 0) setSelectedAgent(loadedAgents[0]);
      } catch (e) { console.error(e); }
    };
    loadAgents();
  }, []);

  // ── AG-UI event handler ──────────────────────────────
  const handleEvent = (event: AGUIEvent) => {
    switch (event.type) {
      // Lifecycle
      case "RunStarted":
        setIsLoading(true);
        setActiveSteps([]);
        clearPendingToolCalls();
        toolArgsBufferRef.current = {};
        break;

      case "RunFinished":
        setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
        setIsLoading(false);
        setActiveSteps([]);
        break;

      case "RunError":
        setIsLoading(false);
        setActiveSteps([]);
        break;

      // State
      case "StateSnapshot":
        setAgentSnapshot((event as any).snapshot ?? null);
        break;

      case "StateDelta":
        // For now we just refresh the bond score if present in the patch
        for (const op of (event as any).delta ?? []) {
          if (op.path === "/family/overallHealth" && op.value != null) {
            setBondScore(op.value);
          }
        }
        break;

      // Steps
      case "StepStarted":
        setActiveSteps(prev => [...prev, { name: (event as any).stepName, done: false }]);
        setThoughts(prev => [
          ...prev,
          { id: Math.random().toString(), content: (event as any).stepName, type: "reasoning", status: "pending" },
        ]);
        break;

      case "StepFinished":
        setActiveSteps(prev => prev.map(s => s.name === (event as any).stepName ? { ...s, done: true } : s));
        setThoughts(prev =>
          prev.map(t =>
            t.content === (event as any).stepName && t.status === "pending" ? { ...t, status: "completed" } : t,
          ),
        );
        break;

      // Text messages
      case "TextMessageStart":
        setMessages(prev => [
          ...prev,
          {
            id: (event as any).messageId || Date.now().toString(),
            content: "",
            sender: "agent",
            agentName: selectedAgent?.name,
            timestamp: new Date(),
            isStreaming: true,
          },
        ]);
        break;

      case "TextMessageContent":
        setMessages(prev => {
          const last = prev[prev.length - 1];
          if (last && last.sender === "agent" && last.isStreaming) {
            return [...prev.slice(0, -1), { ...last, content: last.content + ((event as any).content ?? "") }];
          }
          // Fallback: create a new message if TextMessageStart was missed
          return [
            ...prev,
            {
              id: (event as any).messageId || Date.now().toString(),
              content: (event as any).content ?? "",
              sender: "agent" as const,
              agentName: selectedAgent?.name,
              timestamp: new Date(),
              isStreaming: true,
            },
          ];
        });
        break;

      case "TextMessageEnd":
        setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
        break;

      // Tool calls
      case "ToolCallStart": {
        const { toolCallId, toolCallName } = event as any;
        toolArgsBufferRef.current[toolCallId] = "";
        setThoughts(prev => [
          ...prev,
          { id: toolCallId, content: `Tool: ${toolCallName}`, type: "tool", status: "pending" },
        ]);
        break;
      }

      case "ToolCallArgs": {
        const { toolCallId, delta } = event as any;
        if (toolCallId && delta) {
          toolArgsBufferRef.current[toolCallId] = (toolArgsBufferRef.current[toolCallId] || "") + delta;
        }
        break;
      }

      case "ToolCallEnd": {
        const { toolCallId } = event as any;
        const argsJson = toolArgsBufferRef.current[toolCallId];
        // Find the matching tool name from the thoughts
        const matchingThought = thoughts.find(t => t.id === toolCallId);
        const toolName = matchingThought?.content?.replace("Tool: ", "") ?? "";

        // Check if this is a frontend tool
        if (tools.some(t => t.name === toolName) && argsJson) {
          try {
            enqueueToolCall(toolCallId, toolName, JSON.parse(argsJson));
          } catch { /* malformed JSON — skip */ }
        }

        setThoughts(prev => prev.map(t => t.id === toolCallId ? { ...t, status: "completed" } : t));
        delete toolArgsBufferRef.current[toolCallId];
        break;
      }

      // Custom events
      case "Custom": {
        const { name, value } = event as any;
        if (name === "family.bond_score_update" && value?.newScore != null) {
          setBondScore(value.newScore);
        }
        break;
      }
    }
  };

  const handleSendMessage = () => {
    if (!input.trim() || !selectedAgent || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setThoughts([]);

    // Abort any previous stream
    abortRef.current?.abort();

    abortRef.current = apiClient.streamAGUI(
      selectedAgent.id,
      userMsg.content,
      handleEvent,
      { tools },
    );
  };

  const handleToolApprove = (toolCallId: string) => {
    resolveToolCall(toolCallId);
    // In a full bidirectional setup the result would be POSTed back.
    // For now we log approval and let the run continue.
    console.log("[AG-UI] Tool approved:", toolCallId);
  };

  const handleToolReject = (toolCallId: string) => {
    resolveToolCall(toolCallId);
    console.log("[AG-UI] Tool rejected:", toolCallId);
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl overflow-hidden border border-purple-100">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-xl text-white shadow-lg">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Family Protocol Chat</h2>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-500 font-medium">AG-UI v1.1 Streaming Active</span>
            </div>
          </div>
        </div>
        
        {bondScore !== null && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2 bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200"
          >
            <Heart className="w-4 h-4 text-purple-600 fill-purple-600" />
            <span className="text-sm font-bold text-purple-900">Bond Score: {bondScore}</span>
          </motion.div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        <div className="flex justify-center">
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-xs flex items-center gap-2 border border-blue-100">
                <Info className="w-3 h-3" />
                <span>Standardized Agent-User Interaction Protocol enabled</span>
            </div>
        </div>

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
              msg.sender === "user" 
                ? "bg-purple-600 text-white rounded-tr-none" 
                : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              <span className={`text-[10px] mt-2 block opacity-60 ${msg.sender === "user" ? "text-right" : ""}`}>
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Tool approval dialogs */}
        <AnimatePresence>
          {pendingToolCalls.map(call => (
            <ToolApprovalCard key={call.toolCallId} call={call} onApprove={handleToolApprove} onReject={handleToolReject} />
          ))}
        </AnimatePresence>

        <StepProgress steps={activeSteps} />
        <ThoughtProcess thoughts={thoughts} isThinking={isLoading && thoughts.length > 0} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-gray-100">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="Type your message to the family agents..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white p-3 rounded-xl transition-all shadow-md active:scale-95"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
