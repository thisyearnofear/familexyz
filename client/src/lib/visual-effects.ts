// Single source of truth for all visual effects and animations
// Following DRY principle - all shared visual logic consolidated here

export const visualEffects = {
  // Color palettes for family-themed gradients
  colors: {
    family: {
      warm: "from-orange-400 via-pink-400 to-purple-500",
      love: "from-pink-400 via-red-400 to-rose-500",
      wisdom: "from-purple-500 via-indigo-500 to-blue-500",
      growth: "from-green-400 via-emerald-500 to-teal-500",
      connection: "from-blue-400 via-purple-500 to-pink-500"
    },
    premium: {
      gold: "from-amber-400 via-yellow-500 to-orange-500",
      silver: "from-gray-300 via-gray-400 to-gray-500",
      electric: "from-indigo-500 via-purple-500 to-pink-500"
    }
  },

  // Reusable animation variants for Framer Motion
  animations: {
    fadeInUp: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.3 }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    slideIn: {
      initial: { opacity: 0, x: -20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 20 },
      transition: { duration: 0.2 }
    },
    hover: {
      scale: 1.02,
      y: -2,
      transition: { type: "spring", stiffness: 400, damping: 17 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    }
  },

  // CSS class generators for consistent styling
  classes: {
    gleamEffect: (intensity: "subtle" | "medium" | "strong" = "medium") => {
      const intensityMap = {
        subtle: "before:via-white/10",
        medium: "before:via-white/20",
        strong: "before:via-white/30"
      };

      return `
        relative overflow-hidden
        before:absolute before:inset-0 before:bg-gradient-to-r
        before:from-transparent ${intensityMap[intensity]} before:to-transparent
        before:translate-x-[-100%] before:transition-transform before:duration-700
        hover:before:translate-x-[100%]
      `;
    },

    electricBorder: () => `
      relative
      before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r
      before:from-purple-500 before:via-pink-500 before:to-purple-500
      before:rounded-xl before:animate-pulse
      after:absolute after:inset-[2px] after:bg-slate-900/95 after:rounded-lg
    `,

    glassEffect: (opacity: number = 0.1) => `
      backdrop-blur-sm bg-white/${opacity * 100}
      border border-white/${opacity * 50}
      shadow-lg
    `,

    premiumShadow: (color: string = "purple") => `
      shadow-xl hover:shadow-2xl
      hover:shadow-${color}-500/25
      transition-shadow duration-300
    `
  },

  // Utility functions for dynamic styles
  utils: {
    generateGlow: (color: string, intensity: number = 0.4) => ({
      boxShadow: `0 0 30px ${color}${Math.round(intensity * 100)}, 0 0 60px ${color}${Math.round(intensity * 50)}`
    }),

    generateGradient: (colors: string[], direction: string = "to right") =>
      `linear-gradient(${direction}, ${colors.join(", ")})`,

    getRandomFamilyColor: () => {
      const colors = Object.values(visualEffects.colors.family);
      return colors[Math.floor(Math.random() * colors.length)];
    }
  }
};

// Family-specific theme constants
export const familyTheme = {
  agents: {
    Wisdom: {
      color: "#8B5CF6", // Purple
      gradient: "from-purple-500 to-purple-600",
      glow: "#8B5CF640"
    },
    Intimacy: {
      color: "#EC4899", // Pink
      gradient: "from-pink-500 to-pink-600",
      glow: "#EC489940"
    },
    GenerationalBridge: {
      color: "#3B82F6", // Blue
      gradient: "from-blue-500 to-blue-600",
      glow: "#3B82F640"
    },
    Presence: {
      color: "#10B981", // Green
      gradient: "from-green-500 to-green-600",
      glow: "#10B98140"
    },
    Growth: {
      color: "#F59E0B", // Orange
      gradient: "from-orange-500 to-orange-600",
      glow: "#F59E0B40"
    }
  },

  emotions: {
    joy: "#FCD34D",
    love: "#F87171",
    peace: "#34D399",
    wisdom: "#A78BFA",
    growth: "#FB923C"
  }
};