/**
 * Shared theme constants for FamilyXYZ
 * Single source of truth for colors, spacing, and design tokens
 */

// Agent/Family member colors
export const AGENT_COLORS = {
    WISDOM: "#8B5CF6",    // Purple
    INTIMACY: "#EC4899",  // Pink
    PRESENCE: "#10B981",  // Green
    BRIDGE: "#3B82F6",    // Blue
    GROWTH: "#F59E0B",    // Orange/amber
} as const;

// Brand gradient colors for 3D scenes
export const BRAND_GRADIENT = {
    PRIMARY: "#8B5CF6",   // Purple
    SECONDARY: "#EC4899", // Pink
    TERTIARY: "#3B82F6",  // Blue
} as const;

// Semantic color tokens
export const SEMANTIC_COLORS = {
    SUCCESS: "#10B981",
    WARNING: "#F59E0B",
    ERROR: "#EF4444",
    INFO: "#3B82F6",
} as const;

// Agent emoji mappings
export const AGENT_EMOJIS = {
    WISDOM: "🧠",
    INTIMACY: "💖",
    PRESENCE: "🧘",
    BRIDGE: "👵👦",
    GROWTH: "🌱",
} as const;

// Particle color palette for 3D effects
export const PARTICLE_PALETTE = [
    AGENT_COLORS.WISDOM,
    AGENT_COLORS.INTIMACY,
    BRAND_GRADIENT.TERTIARY,
] as const;

// Default member configuration
export const DEFAULT_MEMBERS = [
    { id: "1", name: "Wisdom", color: AGENT_COLORS.WISDOM, position: [0, 0, 0] as [number, number, number], size: 0.45 },
    { id: "2", name: "Intimacy", color: AGENT_COLORS.INTIMACY, position: [1.3, 0.4, -0.4] as [number, number, number], size: 0.38 },
    { id: "3", name: "Presence", color: AGENT_COLORS.PRESENCE, position: [-1.1, -0.4, 0.25] as [number, number, number], size: 0.38 },
    { id: "4", name: "Bridge", color: AGENT_COLORS.BRIDGE, position: [0.7, -0.8, -0.7] as [number, number, number], size: 0.32 },
    { id: "5", name: "Growth", color: AGENT_COLORS.GROWTH, position: [-0.4, 0.8, 0.4] as [number, number, number], size: 0.32 },
] as const;

// Connection strengths between agents
export const DEFAULT_CONNECTIONS = [
    { from: "1", to: "2", strength: 1 },
    { from: "1", to: "3", strength: 0.85 },
    { from: "1", to: "4", strength: 0.9 },
    { from: "2", to: "5", strength: 0.75 },
    { from: "3", to: "5", strength: 0.65 },
    { from: "4", to: "2", strength: 0.55 },
] as const;
