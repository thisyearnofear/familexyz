// Family Dashboard Theme Configuration
// Following the ENHANCEMENT FIRST principle - improving existing patterns

export const familyTheme = {
  // Vibrant colors for different family agent types with better contrast
  agents: {
    wisdom: {
      primary: "from-purple-600 to-purple-700",
      secondary: "bg-purple-500 text-white",
      border: "border-purple-500",
      ring: "ring-purple-500",
      accent: "text-purple-600",
      bg: "bg-purple-500",
    },
    intimacy: {
      primary: "from-pink-600 to-pink-700", 
      secondary: "bg-pink-500 text-white",
      border: "border-pink-500",
      ring: "ring-pink-500",
      accent: "text-pink-600",
      bg: "bg-pink-500",
    },
    generationalBridge: {
      primary: "from-blue-600 to-blue-700",
      secondary: "bg-blue-500 text-white", 
      border: "border-blue-500",
      ring: "ring-blue-500",
      accent: "text-blue-600",
      bg: "bg-blue-500",
    },
    presence: {
      primary: "from-emerald-600 to-emerald-700",
      secondary: "bg-emerald-500 text-white",
      border: "border-emerald-500", 
      ring: "ring-emerald-500",
      accent: "text-emerald-600",
      bg: "bg-emerald-500",
    },
    growth: {
      primary: "from-orange-600 to-orange-700",
      secondary: "bg-orange-500 text-white",
      border: "border-orange-500",
      ring: "ring-orange-500",
      accent: "text-orange-600",
      bg: "bg-orange-500",
    },
  },
  
  // Consistent spacing system
  spacing: {
    xs: "0.25rem",  // 4px
    sm: "0.5rem",   // 8px
    md: "1rem",     // 16px
    lg: "1.5rem",   // 24px
    xl: "2rem",     // 32px
    "2xl": "3rem",  // 48px
  },
  
  // Consistent typography
  typography: {
    h1: "text-4xl font-bold",
    h2: "text-3xl font-bold", 
    h3: "text-2xl font-semibold",
    h4: "text-xl font-semibold",
    body: "text-base",
    small: "text-sm",
    caption: "text-xs",
  },
  
  // Consistent border radii
  borderRadius: {
    sm: "0.125rem",  // 2px
    md: "0.25rem",   // 4px
    lg: "0.5rem",    // 8px
    xl: "0.75rem",   // 12px
    "2xl": "1rem",   // 16px
    full: "9999px",  // Full circle
  },
  
  // Enhanced shadows for better depth
  shadows: {
    sm: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.15), 0 2px 4px -2px rgb(0 0 0 / 0.15)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.2)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.25), 0 8px 10px -6px rgb(0 0 0 / 0.25)",
    interactive: "0 8px 16px -4px rgb(0 0 0 / 0.3), 0 4px 8px -2px rgb(0 0 0 / 0.2)",
    glow: "0 0 20px -5px rgb(147 51 234 / 0.5), 0 0 30px -5px rgb(236 72 153 / 0.3)",
  },
  
  // Enhanced transitions for more dynamic feel
  transitions: {
    fast: "transition-all duration-200 ease-out",
    normal: "transition-all duration-300 ease-out",
    slow: "transition-all duration-500 ease-out",
    interactive: "transition-all duration-150 ease-out",
  },
  
  // Responsive breakpoints
  breakpoints: {
    xs: "480px",
    sm: "640px",
    md: "768px", 
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
  
  // Vibrant gradients for family dashboard
  gradients: {
    primary: "from-purple-600 via-pink-600 to-orange-500",
    secondary: "from-blue-600 via-purple-600 to-pink-500", 
    background: "from-purple-50 via-pink-50 to-orange-50",
    card: "from-white to-purple-50",
    interactive: "from-purple-500 to-pink-500",
    success: "from-emerald-500 to-green-500",
    attention: "from-yellow-500 to-orange-500",
  },
  
  // Consistent icon sizes
  iconSizes: {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-8 h-8",
    "2xl": "w-10 h-10",
  },
} as const;

// Type for agent colors
export type AgentColor = keyof typeof familyTheme.agents;

// Utility function to get agent color classes
export function getAgentColorClasses(agentType: string): {
  primary: string;
  secondary: string;
  border: string;
  ring: string;
  accent: string;
  bg: string;
} {
  const normalizedType = agentType.toLowerCase().replace(/\s+/g, '');
  const agentKey = Object.keys(familyTheme.agents).find(key => 
    normalizedType.includes(key.toLowerCase())
  ) as AgentColor;
  
  return agentKey ? familyTheme.agents[agentKey] : familyTheme.agents.wisdom;
}

// Typography utility
export function getTypographyClass(level: keyof typeof familyTheme.typography): string {
  return familyTheme.typography[level];
}

// Spacing utility
export function getSpacingClass(size: keyof typeof familyTheme.spacing): string {
  // This would be used differently in practice - Tailwind classes
  return familyTheme.spacing[size];
}