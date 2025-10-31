import React, { useRef } from "react";
import { motion } from "framer-motion";
import { familyTheme } from "@/lib/visual-effects";
import { Brain, Heart, Users, Leaf, Rocket } from "lucide-react";

interface FamilyConnectionRingsProps {
    healthScore?: number;
    activeAgents?: string[];
    className?: string;
}

export const FamilyConnectionRings: React.FC<FamilyConnectionRingsProps> = ({
    healthScore = 75,
    activeAgents = [
        "Wisdom",
        "Intimacy",
        "GenerationalBridge",
        "Presence",
        "Growth",
    ],
    className = "",
}) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Create rings based on active agents
    const rings = activeAgents.map((agent, ringIndex) => {
        const agentTheme =
            familyTheme.agents[agent as keyof typeof familyTheme.agents];
        const radius = 60 + ringIndex * 25;
        const rotationSpeed = 0.5 + ringIndex * 0.2;

        return {
            agent,
            radius,
            rotationSpeed,
            color: agentTheme?.color || "#8B5CF6",
            gradient: agentTheme?.gradient || "from-purple-500 to-purple-600",
        };
    });

    return (
        <div
            ref={containerRef}
            className={`relative w-64 h-64 mx-auto ${className}`}
            role="img"
            aria-label={`Family connection visualization with ${activeAgents.length} active agents and ${healthScore}% health score`}
        >
            {/* Central family icon */}
            <div className="absolute inset-0 flex items-center justify-center z-10">
                <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-2xl shadow-lg"
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    aria-hidden="true"
                >
                    <Users className="w-8 h-8 text-white" />
                </motion.div>
            </div>

            {/* Connection rings */}
            {rings.map((ring, index) => (
                <motion.div
                    key={ring.agent}
                    className="absolute inset-0"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 20 / ring.rotationSpeed,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    aria-hidden="true"
                >
                    {/* Ring path */}
                    <svg
                        className="w-full h-full"
                        viewBox="0 0 256 256"
                        aria-hidden="true"
                    >
                        <circle
                            cx="128"
                            cy="128"
                            r={ring.radius}
                            fill="none"
                            stroke={ring.color}
                            strokeWidth="2"
                            strokeOpacity="0.3"
                            strokeDasharray="5,5"
                        />
                    </svg>

                    {/* Agent icons on the ring */}
                    {[0, 1, 2].map((iconIndex) => {
                        const angle = iconIndex * 120 * (Math.PI / 180);
                        const x = 128 + ring.radius * Math.cos(angle);
                        const y = 128 + ring.radius * Math.sin(angle);

                        return (
                            <motion.div
                                key={`${ring.agent}-${iconIndex}`}
                                className="absolute w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md"
                                style={{
                                    left: x - 16,
                                    top: y - 16,
                                    background: `linear-gradient(135deg, ${ring.color}90, ${ring.color}60)`,
                                }}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.7, 1, 0.7],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: iconIndex * 0.5,
                                    ease: "easeInOut",
                                }}
                                aria-hidden="true"
                            >
                                {getAgentIcon(ring.agent)}
                            </motion.div>
                        );
                    })}
                </motion.div>
            ))}

            {/* Health score indicator */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full mt-4">
                <motion.div
                    className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-purple-200/50"
                    animate={{ y: [0, -5, 0] }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    aria-label={`Family health score: ${healthScore} percent connected`}
                >
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-900">
                            {healthScore}% Connected
                        </span>
                    </div>
                </motion.div>
            </div>

            {/* Ambient glow effect */}
            <div
                className="absolute inset-0 rounded-full opacity-20 blur-3xl"
                style={{
                    background: `radial-gradient(circle, ${rings[0]?.color}40, transparent 70%)`,
                }}
                aria-hidden="true"
            />
        </div>
    );
};

// Helper function to get icon for each agent
function getAgentIcon(agent: string): React.ReactNode {
    const iconMap: Record<string, React.ReactNode> = {
        Wisdom: <Brain className="w-4 h-4 text-white" />,
        Intimacy: <Heart className="w-4 h-4 text-white" />,
        GenerationalBridge: <Users className="w-4 h-4 text-white" />,
        Presence: <Leaf className="w-4 h-4 text-white" />,
        Growth: <Rocket className="w-4 h-4 text-white" />,
    };
    return iconMap[agent] || <Users className="w-4 h-4 text-white" />;
}
