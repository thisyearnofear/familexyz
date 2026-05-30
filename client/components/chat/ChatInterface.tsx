'use client';

import React, { useState } from "react";

interface ChatInterfaceProps {
    initialAgentId: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
    initialAgentId,
}) => {
    const [messages, setMessages] = useState<
        { role: "user" | "assistant"; content: string }[]
    >([]);
    const [input, setInput] = useState("");

    const handleSend = async () => {
        if (!input.trim()) return;
        setMessages((prev) => [
            ...prev,
            { role: "user", content: input },
        ]);
        setInput("");

        try {
            const response = await fetch(`/api/transform`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: input,
                    agentId: initialAgentId,
                }),
            });
            const data = await response.json();
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.transformed },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: "Error: Failed to get response",
                },
            ]);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-4 p-4">
                {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Chat with agent: {initialAgentId}</p>
                        <p className="text-sm mt-2">Send a message to start chatting.</p>
                    </div>
                )}
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={`flex ${
                            msg.role === "user"
                                ? "justify-end"
                                : "justify-start"
                        }`}
                    >
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                            }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t p-4 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <button
                    onClick={handleSend}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
                >
                    Send
                </button>
            </div>
        </div>
    );
};
