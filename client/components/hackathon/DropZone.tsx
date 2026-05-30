'use client';

import { useState, useCallback } from "react";
import { motion } from "framer-motion";

interface DropZoneProps {
    onDrop: (content: string) => void;
    isLoading: boolean;
}

export function DropZone({ onDrop, isLoading }: DropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [text, setText] = useState("");

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedText = e.dataTransfer.getData("text");
            if (droppedText) {
                setText(droppedText);
            }
        },
        []
    );

    const handleSubmit = () => {
        if (text.trim() && !isLoading) {
            onDrop(text.trim());
        }
    };

    return (
        <div className="border border-green-500/30 rounded-lg p-4 bg-black/50">
            <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider mb-4">
                Input Content
            </h2>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
                    isDragging
                        ? "border-green-400 bg-green-500/5"
                        : "border-green-500/20"
                }`}
            >
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your content here, or drag text in..."
                    className="w-full h-24 bg-transparent text-green-400 font-mono text-sm placeholder-green-700 resize-none focus:outline-none"
                    disabled={isLoading}
                />
            </div>
            <motion.button
                onClick={handleSubmit}
                disabled={!text.trim() || isLoading}
                className={`mt-3 w-full py-2 rounded text-sm font-mono transition-colors ${
                    !text.trim() || isLoading
                        ? "bg-green-900/20 text-green-700 cursor-not-allowed"
                        : "bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500/20"
                }`}
                whileHover={
                    text.trim() && !isLoading
                        ? { scale: 1.01 }
                        : {}
                }
                whileTap={
                    text.trim() && !isLoading
                        ? { scale: 0.99 }
                        : {}
                }
            >
                {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                        <span className="w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
                        Transforming...
                    </span>
                ) : (
                    "[transform]"
                )}
            </motion.button>
        </div>
    );
}
