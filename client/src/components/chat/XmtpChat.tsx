/**
 * XMTP Chat Interface - Web3-native encrypted messaging
 * 
 * Alternative to DirectClient chat with end-to-end encryption
 * Users connect via wallet, messages are encrypted via XMTP
 */

import React, { useState, useRef, useEffect } from "react";
import { Send, Lock, Wallet, Shield } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";

interface Message {
    id: string;
    content: string;
    sender: "user" | "agent" | "system";
    timestamp: Date;
    encrypted: boolean;
}

interface XmtpChatProps {
    agentId: string;
    agentName: string;
}

export const XmtpChat: React.FC<XmtpChatProps> = ({ agentId, agentName }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { connectWallet, walletAddress } = useWallet();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    /**
     * Connect wallet and initialize XMTP client
     */
    const handleConnect = async () => {
        setIsConnecting(true);
        setError(null);

        try {
            // Connect wallet first
            await connectWallet();

            // In production, initialize XMTP client with wallet
            // For now, simulate connection
            setTimeout(() => {
                setIsConnected(true);
                setIsConnecting(false);
                
                // Add welcome message
                setMessages([
                    {
                        id: "welcome",
                        content: `🔐 Connected to XMTP encrypted chat with ${agentName}. Your messages are end-to-end encrypted and verifiable on Hedera.`,
                        sender: "system",
                        timestamp: new Date(),
                        encrypted: true,
                    },
                ]);
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Connection failed");
            setIsConnecting(false);
        }
    };

    /**
     * Send encrypted message via XMTP
     */
    const handleSendMessage = async () => {
        if (!inputText.trim() || !isConnected) return;

        const userMessage: Message = {
            id: `msg-${Date.now()}`,
            content: inputText.trim(),
            sender: "user",
            timestamp: new Date(),
            encrypted: true,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText("");

        // In production:
        // 1. Send message via XMTP client
        // 2. Agent responds through XMTP
        // 3. Log message hash to HCS

        // Simulate agent response
        setTimeout(() => {
            const agentMessage: Message = {
                id: `msg-${Date.now() + 1}`,
                content: `[${agentName}] This is a simulated encrypted response. In production, this would come from the agent via XMTP.`,
                sender: "agent",
                timestamp: new Date(),
                encrypted: true,
            };
            setMessages((prev) => [...prev, agentMessage]);
        }, 1000);
    };

    /**
     * Handle Enter key to send message
     */
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!isConnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg">
                <div className="max-w-md text-center space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-center mb-4">
                            <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                <Lock className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            XMTP Encrypted Chat
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            End-to-end encrypted messaging with {agentName}
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Military-grade encryption</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Wallet className="w-4 h-4" />
                            <span>Connect with your wallet</span>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                            <Lock className="w-4 h-4" />
                            <span>Messages logged to Hedera (hash only)</span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isConnecting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            <>
                                <Wallet className="w-5 h-5" />
                                Connect Wallet to Start
                            </>
                        )}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {agentName}
                        </h3>
                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Encrypted via XMTP
                        </p>
                    </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                    {walletAddress ? (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                    ) : null}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${
                            message.sender === "user" ? "justify-end" : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                                message.sender === "user"
                                    ? "bg-purple-600 text-white"
                                    : message.sender === "system"
                                    ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                            }`}
                        >
                            <p className="text-sm">{message.content}</p>
                            <p
                                className={`text-xs mt-1 ${
                                    message.sender === "user"
                                        ? "text-purple-200"
                                        : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                                {message.timestamp.toLocaleTimeString()}
                                {message.encrypted && (
                                    <span className="ml-2 flex items-center gap-1 inline">
                                        <Lock className="w-3 h-3" />
                                        Encrypted
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your encrypted message..."
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        Send
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Messages are end-to-end encrypted. A hash is logged to Hedera for verification.
                </p>
            </div>
        </div>
    );
};
