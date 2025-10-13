import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Enhanced interactive button with animations
export const InteractiveButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, variant = "primary", size = "md", className = "", disabled = false }) => {
  const baseClasses = "font-medium rounded-lg transition-all duration-200 transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 shadow-lg hover:shadow-xl",
    secondary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500 shadow-lg hover:shadow-xl",
    outline: "border-2 border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white focus:ring-purple-500",
    ghost: "text-purple-600 hover:bg-purple-50 focus:ring-purple-500",
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseClasses}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};

// Glow effect component for interactive elements
export const GlowEffect: React.FC<{
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}> = ({ children, active = false, className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <div className={`
        absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 
        rounded-lg blur opacity-0 transition-opacity duration-300
        ${active ? 'opacity-75 animate-pulse' : 'opacity-0'}
      `}></div>
      {children}
    </div>
  );
};

// Animated counter for statistics
export const AnimatedCounter: React.FC<{
  value: number;
  suffix?: string;
  duration?: number;
  className?: string;
}> = ({ value, suffix = "", duration = 2000, className = "" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = value / (duration / 16);
    const timer = setInterval(() => {
      setCount(prev => {
        const next = prev + increment;
        return next >= value ? value : next;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration, increment]);

  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={className}
    >
      {Math.round(count)}{suffix}
    </motion.span>
  );
};

// Interactive tooltip with animations
export const InteractiveTooltip: React.FC<{
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
}> = ({ content, children, position = "top" }) => {
  const [visible, setVisible] = useState(false);
  
  const positionClasses = {
    top: "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 transform -translate-x-1/2 mt-2",
    left: "right-full top-1/2 transform -translate-y-1/2 mr-2",
    right: "left-full top-1/2 transform -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className={`
              absolute z-50 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm
              whitespace-nowrap ${positionClasses[position]} pointer-events-none
              shadow-lg
            `}
          >
            {content}
            <div className={`
              absolute w-2 h-2 bg-gray-900 rotate-45
              ${position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' : ''}
              ${position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' : ''}
              ${position === 'left' ? 'right-full top-1/2 -translate-y-1/2 -mr-1' : ''}
              ${position === 'right' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' : ''}
            `}></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Pulse animation for important elements
export const PulseAnimation: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          "0 0 0 0 rgba(147, 51, 234, 0.7)",
          "0 0 0 10px rgba(147, 51, 234, 0)",
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Animated progress bar
export const AnimatedProgressBar: React.FC<{
  value: number;
  max?: number;
  label?: string;
  color?: string;
}> = ({ value, max = 100, label, color = "from-purple-500 to-pink-500" }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className="w-full">
      {label && <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`
            h-full bg-gradient-to-r ${color} rounded-full
            relative overflow-hidden
          `}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"></div>
        </motion.div>
      </div>
      <div className="text-right text-xs text-gray-500 mt-1">
        {Math.round(percentage)}%
      </div>
    </div>
  );
};