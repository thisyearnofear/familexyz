import React, {
    useState,
    useRef,
    useEffect,
    useCallback,
    useMemo,
} from "react";
import {
    Send,
    Bot,
    MessageCircle,
    Brain,
    Heart,
    Users,
    Leaf,
    Rocket,
    ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/lib/api";

interface Message {
    id: string;
    content: string;
    sender: "user" | "agent" | "system";
    agentName?: string;
    timestamp: Date;
}

interface Agent {
    id: string;
    name: string;
    description: string;
    color: string;
}

// Agent configurations with consistent icons
const agentConfigs: Record<
    string,
    { description: string; color: string; icon: React.ReactNode }
> = {
    Wisdom: {
        description: "Philosophy & Emotional Intelligence",
        color: "bg-purple-500",
        icon: <Brain className="w-4 h-4" />,
    },
    Intimacy: {
        description: "Relationship Coaching",
        color: "bg-pink-500",
        icon: <Heart className="w-4 h-4" />,
    },
    GenerationalBridge: {
        description: "Cross-generational Connection",
        color: "bg-blue-500",
        icon: <Users className="w-4 h-4" />,
    },
    Presence: {
        description: "Mindful Presence",
        color: "bg-green-500",
        icon: <Leaf className="w-4 h-4" />,
    },
    Growth: {
        description: "Family Growth Challenges",
        color: "bg-orange-500",
        icon: <Rocket className="w-4 h-4" />,
    },
};

// Memoized message component to prevent unnecessary re-renders
const MessageItem = React.memo(
    ({
        message,
    }: {
        message: Message;
        selectedAgent?: Agent | null;
    }) => {
        return (
            <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
                <div
                    className={`max-w-[85%] sm:max-w-[70%] rounded-lg px-3 py-2 sm:px-4 sm:py-2 ${
                        message.sender === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900"
                    }`}
                >
                    {message.sender === "agent" && (
                        <div className="flex items-center space-x-2 mb-1">
                            <Bot className="w-4 h-4" />
                            <span className="text-xs font-medium text-gray-700">
                                {message.agentName}
                            </span>
                        </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                    </p>
                    <p
                        className={`text-xs mt-1 ${
                            message.sender === "user"
                                ? "text-purple-200"
                                : "text-gray-600"
                        }`}
                    >
                        {message.timestamp.toLocaleTimeString()}
                    </p>
                </div>
            </div>
        );
    },
);

const SystemMessageItem = ({ message, onAction }: { message: Message; onAction: (path: string) => void }) => {
    const isAction = message.content.startsWith("ACTION:");
    const path = isAction ? message.content.replace("ACTION:", "") : "";

    // Helper to get readable label from path
    const getLabel = (p: string) => {
        if (p.includes("activities")) return "View Activities Calendar";
        if (p.includes("social")) return "View Family Feed";
        if (p.includes("treasury")) return "Manage Family Treasury";
        if (p.includes("members")) return "View Family Members";
        if (p.includes("insights")) return "View Family Insights";
        return "View Suggested Page";
    };

    if (isAction) {
        return (
            <div className="flex justify-center my-4">
                <button
                    onClick={() => onAction(path)}
                    className="bg-white border border-purple-200 shadow-sm rounded-xl px-4 py-3 flex items-center space-x-3 hover:bg-purple-50 transition-colors group"
                >
                    <div className="bg-purple-100 p-2 rounded-full group-hover:bg-purple-200 transition-colors">
                        <Rocket className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-left">
                        <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Suggested Action</span>
                        <span className="block text-sm font-semibold text-purple-900 flex items-center gap-1">
                            {getLabel(path)}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                        </span>
                    </div>
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-2">
            <div className="bg-gray-50 border border-gray-200 rounded-full px-4 py-1 flex items-center space-x-2 text-xs text-gray-500">
                <Bot className="w-3 h-3" />
                <span>{message.content}</span>
            </div>
        </div>
    );
};

interface ChatInterfaceProps {
    initialAgentId?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    initialAgentId,
}) => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [agentsLoading, setAgentsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Load agents from server
    useEffect(() => {
        const loadAgents = async () => {
            try {
                const response = await apiClient.getAgents();
                // Handle different response structures
                let agentsData = response;
                if (response.data && response.data.agents) {
                    agentsData = response.data;
                }

                const loadedAgents: Agent[] = (agentsData.agents || []).map(
                    (agent: any) => ({
                        id: agent.id || agent.agentId,
                        name: agent.name || agent.id || agent.agentId,
                        description:
                            agentConfigs[agent.name || agent.id]?.description ||
                            "Family Agent",
                        color:
                            agentConfigs[agent.name || agent.id]?.color ||
                            "bg-gray-500",
                    }),
                );

                // Map agent IDs to match server expectations
                const agentIdMapping: Record<string, string> = {
                    Wisdom: "wisdom-agent",
                    Intimacy: "intimacy-agent",
                    GenerationalBridge: "generationalbridge-agent",
                    Presence: "presence-agent",
                    Growth: "growth-agent",
                };

                // Update loaded agents with correct IDs
                const correctedAgents = loadedAgents.map((agent) => ({
                    ...agent,
                    id: agentIdMapping[agent.name] || agent.id,
                }));

                setAgents(correctedAgents);
                if (correctedAgents.length > 0) {
                    // Pre-select agent if initialAgentId is provided
                    const targetAgent = initialAgentId
                        ? correctedAgents.find(
                              (agent) => agent.id === initialAgentId,
                          )
                        : null;
                    setSelectedAgent(targetAgent || correctedAgents[0]);
                }
            } catch (error) {
                console.error("Failed to load agents:", error);
            } finally {
                setAgentsLoading(false);
            }
        };
        loadAgents();
    }, [initialAgentId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Load messages from localStorage
    useEffect(() => {
        if (selectedAgent) {
            const savedMessages = localStorage.getItem(`chat_history_${selectedAgent.id}`);
            if (savedMessages) {
                try {
                    const parsed = JSON.parse(savedMessages);
                    // Convert string timestamps back to Date objects
                    const hydrated = parsed.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    }));
                    setMessages(hydrated);
                } catch (e) {
                    console.error("Failed to load chat history", e);
                }
            } else {
                setMessages([]);
            }
        }
    }, [selectedAgent?.id]);

    // Save messages to localStorage
    useEffect(() => {
        if (selectedAgent && messages.length > 0) {
            localStorage.setItem(`chat_history_${selectedAgent.id}`, JSON.stringify(messages));
        }
    }, [messages, selectedAgent?.id]);

    // Memoize messages to prevent unnecessary re-renders
    const memoizedMessages = useMemo(() => messages, [messages]);

    const sendMessage = useCallback(async () => {
        if (!inputMessage.trim() || isLoading || !selectedAgent) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            sender: "user",
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputMessage("");
        setIsLoading(true);

        try {
            // Read settings from localStorage
            const savedProfile = localStorage.getItem("familyProfile");
            let settings = {};
            if (savedProfile) {
                try {
                    const profile = JSON.parse(savedProfile);
                    if (profile.preferences?.enableWebSearch) {
                        settings = { enable_web_search: "auto" };
                    }
                } catch (e) {
                    console.error("Failed to parse familyProfile", e);
                }
            }

            // Use the apiClient instead of hardcoded localhost
            const data = await apiClient.sendMessage(
                selectedAgent.id,
                inputMessage,
                null,
                settings
            );

            // Handle both array and object responses
            const responseData = Array.isArray(data) ? data[0] : data;
            let responseText = responseData.text ||
                responseData.response ||
                "I understand your message. How can I help you further?";
            // Check for navigation commands [NAVIGATE: /path]
            const navigateMatch = responseText.match(/\[NAVIGATE:\s*([^\]]+)\]/);
            let actionPath = null;

            if (navigateMatch) {
                actionPath = navigateMatch[1].trim();
                responseText = responseText.replace(navigateMatch[0], "").trim();
            }

            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: responseText,
                sender: "agent",
                agentName: selectedAgent.name,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, agentMessage]);

            // If there was a navigation command, add a system action message
            if (actionPath) {
                setTimeout(() => {
                    const systemMsg: Message = {
                        id: (Date.now() + 2).toString(),
                        content: `ACTION:${actionPath}`,
                        sender: "system",
                        timestamp: new Date()
                    };
                    setMessages(prev => [...prev, systemMsg]);
                }, 500);
            }
        } catch (error) {
            console.error("Error sending message:", error);

            // Agent-specific error responses
            const errorResponses = {
                "wisdom-agent":
                    "I'm here to help with family wisdom and emotional guidance, though I'm having trouble connecting right now. Please share what's on your mind about your family relationships, and I'll do my best to provide thoughtful guidance.",
                "intimacy-agent":
                    "I'm your relationship coaching agent, ready to help strengthen family bonds. While I'm getting reconnected, feel free to tell me about your family's relationship goals or any challenges you're facing.",
                "growth-agent":
                    "I'm all about family growth and shared achievements! Despite the technical hiccup, I'm excited to hear about your family's goals and how we can work together to achieve them.",
                presence:
                    "I focus on mindful family wellness and digital balance. While I'm reconnecting, consider this a mindful moment - what would help your family be more present together?",
            };

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content:
                    (selectedAgent &&
                        errorResponses[
                            selectedAgent.id as keyof typeof errorResponses
                        ]) ||
                    `I'm ${selectedAgent?.name || "your agent"}, here to help with ${selectedAgent?.description.toLowerCase() || "family matters"}. While I'm getting connected, please share what's on your mind.`,
                sender: "agent",
                agentName: selectedAgent?.name || "Agent",
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [inputMessage, isLoading, selectedAgent]);

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        },
        [sendMessage],
    );

    return (
        <div
            className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] md:h-[500px] lg:h-[600px] flex flex-col"
            role="region"
            aria-label="Family Agent Chat"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Family Agent Chat
                        </h3>
                    </div>

                    {/* Agent Selector */}
                    {agentsLoading ? (
                        <div className="text-sm text-gray-700">
                            Loading agents...
                        </div>
                    ) : (
                        <select
                            value={selectedAgent?.id || ""}
                            onChange={(e) =>
                                setSelectedAgent(
                                    agents.find(
                                        (a) => a.id === e.target.value,
                                    ) || agents[0],
                                )
                            }
                            className="px-3 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Select an agent to chat with"
                        >
                            {agents.map((agent) => (
                                <option key={agent.id} value={agent.id}>
                                    {agent.name} - {agent.description}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Selected Agent Info */}
                {selectedAgent && (
                    <div className="mt-2 flex items-center space-x-2">
                        <div
                            className={`w-3 h-3 rounded-full ${selectedAgent.color}`}
                            aria-hidden="true"
                        ></div>
                        <span className="text-sm text-gray-700">
                            Chatting with <strong>{selectedAgent.name}</strong>{" "}
                            - {selectedAgent.description}
                        </span>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto p-4 space-y-4"
                aria-live="polite"
                aria-label="Chat messages"
            >
                {memoizedMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center flex-1 p-8">
                        <div className="text-center max-w-md">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                Welcome to Family Agent Chat!
                            </h3>
                            <p className="text-gray-700 mb-6">
                                Select an agent above and start a conversation
                                to strengthen your family bonds.
                            </p>
                            <div className="bg-blue-50 rounded-lg p-4 text-left border border-blue-100">
                                <p className="text-sm text-blue-900 font-medium mb-2">
                                    Try asking:
                                </p>
                                <ul className="text-xs text-blue-800 space-y-1">
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            "How can you help my family?"
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>"What do you do?"</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="mr-2">•</span>
                                        <span>
                                            "Give me some family advice"
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {memoizedMessages.map((message) => (
                    message.sender === "system" ? (
                        <SystemMessageItem
                            key={message.id}
                            message={message}
                            onAction={(path) => navigate(path)}
                        />
                    ) : (
                        <MessageItem
                            key={message.id}
                            message={message}
                            selectedAgent={selectedAgent}
                        />
                    )
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[70%]">
                            <div className="flex items-center space-x-2">
                                <Bot className="w-4 h-4" />
                                <span className="text-xs font-medium text-gray-700">
                                    {selectedAgent?.name || "Agent"}
                                </span>
                            </div>
                            <div className="flex space-x-1 mt-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                    style={{ animationDelay: "0.2s" }}
                                ></div>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Ask ${selectedAgent?.name || "your agent"} about family relationships...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent min-h-[60px] sm:min-h-[46px]"
                        rows={2}
                        disabled={isLoading}
                        aria-label="Type your message"
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center sm:justify-start space-x-2"
                        aria-label={
                            inputMessage.trim()
                                ? "Send message"
                                : "Enter a message to send"
                        }
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                        <span className="sm:hidden">→</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
