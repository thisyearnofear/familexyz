'use client';

import { motion } from "framer-motion";

interface OutputPanelProps {
    content: string;
}

export function OutputPanel({ content }: OutputPanelProps) {
    const segments = content.split("---").filter(Boolean);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-green-500/30 rounded-lg p-4 bg-black/50"
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                    Transformed Output
                </h2>
                <button
                    onClick={() =>
                        navigator.clipboard.writeText(content)
                    }
                    className="text-xs text-green-600 hover:text-green-400 transition-colors"
                >
                    [copy]
                </button>
            </div>
            <div className="space-y-4">
                {segments.map((segment, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-sm text-green-400/90 leading-relaxed whitespace-pre-wrap font-mono"
                    >
                        {segment}
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
