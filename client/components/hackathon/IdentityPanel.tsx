'use client';

import { useState } from "react";

export function IdentityPanel() {
    const [editing, setEditing] = useState(false);
    const [identity, setIdentity] = useState({
        name: "Agent Prime",
        role: "Family Orchestrator",
        tone: "Warm, empathetic, direct",
        format: "Markdown-friendly prose",
        banned: "Jargon, passive voice, negativity",
    });

    const handleSave = () => {
        setEditing(false);
    };

    return (
        <div className="border border-green-500/30 rounded-lg p-4 bg-black/50">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-green-400 uppercase tracking-wider">
                    ~/identity.md
                </h2>
                <button
                    onClick={() =>
                        editing ? handleSave() : setEditing(true)
                    }
                    className="text-xs text-green-500 hover:text-green-400 transition-colors"
                >
                    {editing ? "[save]" : "[edit]"}
                </button>
            </div>
            <div className="space-y-3 font-mono text-xs">
                {Object.entries(identity).map(([key, value]) => (
                    <div key={key}>
                        <span className="text-green-600">{key}:</span>
                        {editing ? (
                            <input
                                type="text"
                                value={value}
                                onChange={(e) =>
                                    setIdentity((prev) => ({
                                        ...prev,
                                        [key]: e.target.value,
                                    }))
                                }
                                className="ml-2 bg-black border border-green-500/30 rounded px-2 py-0.5 text-green-400 w-full mt-1 focus:outline-none focus:border-green-400"
                            />
                        ) : (
                            <span className="ml-2 text-green-400">
                                {value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
