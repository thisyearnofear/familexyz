import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, MessageCircle } from "lucide-react";
import { apiClient } from "@/lib/api";

interface Message {
    id: string;
    content: string;
    sender: "user" | "agent";
    agentName?: string;
    timestamp: Date;
}

interface Agent {
    id: string;
    name: string;
    description: string;
    color: string;
}

const agents: Agent[] = [
    {
        id: "wisdom",
        name: "Wisdom",
        description: "Philosophy & Emotional Intelligence",
        color: "bg-purple-500",
    },
    {
        id: "intimacy",
        name: "Intimacy",
        description: "Relationship Coaching",
        color: "bg-pink-500",
    },
    {
        id: "generationalbridge",
        name: "Generational Bridge",
        description: "Cross-generational Connection",
        color: "bg-blue-500",
    },
    {
        id: "presence",
        name: "Presence",
        description: "Mindful Presence",
        color: "bg-green-500",
    },
    {
        id: "growth",
        name: "Growth",
        description: "Family Growth Challenges",
        color: "bg-orange-500",
    },
];

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

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
            // Use the apiClient instead of hardcoded localhost
            const data = await apiClient.sendMessage(
                selectedAgent.id,
                inputMessage,
            );

            // Handle both array and object responses
            const responseData = Array.isArray(data) ? data[0] : data;
            const agentMessage: Message = {
                id: (Date.now() + 1).toString(),
                content:
                    responseData.text ||
                    responseData.response ||
                    "I understand your message. How can I help you further?",
                sender: "agent",
                agentName: selectedAgent.name,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, agentMessage]);
        } catch (error) {
            console.error("Error sending message:", error);

            // Agent-specific error responses
            const errorResponses = {
                wisdom: "I'm here to help with family wisdom and emotional guidance, though I'm having trouble connecting right now. Please share what's on your mind about your family relationships, and I'll do my best to provide thoughtful guidance.",
                intimacy:
                    "I'm your relationship coaching agent, ready to help strengthen family bonds. While I'm getting reconnected, feel free to tell me about your family's relationship goals or any challenges you're facing.",
                generationalbridge:
                    "I specialize in connecting different generations in families. Even though I'm having connection issues, I'd love to hear about the different generations in your family and how I can help bridge any communication gaps.",
                presence:
                    "I focus on mindful family wellness and digital balance. While I'm reconnecting, consider this a mindful moment - what would help your family be more present together?",
                growth: "I'm all about family growth and shared achievements! Despite the technical hiccup, I'm excited to hear about your family's goals and how we can work together to achieve them.",
            };

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content:
                    errorResponses[
                        selectedAgent.id as keyof typeof errorResponses
                    ] ||
                    `I'm ${selectedAgent.name}, here to help with ${selectedAgent.description.toLowerCase()}. While I'm getting connected, please share what's on your mind.`,
                sender: "agent",
                agentName: selectedAgent.name,
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <MessageCircle className="w-6 h-6 text-purple-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                            Family Agent Chat
                        </h3>
                    </div>

                    {/* Agent Selector */}
                    <select
                        value={selectedAgent.id}
                        onChange={(e) =>
                            setSelectedAgent(
                                agents.find((a) => a.id === e.target.value) ||
                                    agents[0],
                            )
                        }
                        className="px-3 py-1 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                                {agent.name} - {agent.description}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Agent Info */}
                <div className="mt-2 flex items-center space-x-2">
                    <div
                        className={`w-3 h-3 rounded-full ${selectedAgent.color}`}
                    ></div>
                    <span className="text-sm text-gray-600">
                        Chatting with <strong>{selectedAgent.name}</strong> -{" "}
                        {selectedAgent.description}
                    </span>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-8">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-lg font-medium">
                            Welcome to Family Agent Chat!
                        </p>
                        <p className="text-sm mt-1">
                            Select an agent above and start a conversation to
                            strengthen your family bonds.
                        </p>
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left">
                            <p className="text-sm text-blue-800 font-medium">
                                Try asking:
                            </p>
                            <ul className="text-xs text-blue-700 mt-1 space-y-1">
                                <li>• "How can you help my family?"</li>
                                <li>• "What do you do?"</li>
                                <li>• "Give me some family advice"</li>
                            </ul>
                        </div>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                message.sender === "user"
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-100 text-gray-800"
                            }`}
                        >
                            {message.sender === "agent" && (
                                <div className="flex items-center space-x-2 mb-1">
                                    <Bot className="w-4 h-4" />
                                    <span className="text-xs font-medium text-gray-600">
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
                                        : "text-gray-500"
                                }`}
                            >
                                {message.timestamp.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-[70%]">
                            <div className="flex items-center space-x-2">
                                <Bot className="w-4 h-4" />
                                <span className="text-xs font-medium text-gray-600">
                                    {selectedAgent.name}
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
            <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                <div className="flex space-x-2">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={`Ask ${selectedAgent.name} about family relationships...`}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        rows={2}
                        disabled={isLoading}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                    >
                        <Send className="w-4 h-4" />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
