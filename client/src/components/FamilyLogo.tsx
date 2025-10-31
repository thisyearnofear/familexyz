import React from "react";
import { Users, Home, Heart } from "lucide-react";

interface FamilyLogoProps {
    size?: "sm" | "md" | "lg" | "xl";
    showText?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
};

const iconSizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-10 h-10",
};

export const FamilyLogo: React.FC<FamilyLogoProps> = ({
    size = "md",
    showText = false,
    className = "",
}) => {
    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <Users className={`${iconSizeClasses[size]} text-purple-600`} />
            {showText && (
                <div className="flex flex-col">
                    <span className="font-bold text-gray-900">FamilyXYZ</span>
                    <span className="text-xs text-gray-600">
                        Family Connection Platform
                    </span>
                </div>
            )}
        </div>
    );
};

// Alternative icon options for different contexts
export const FamilyIcons = {
    family: Users,
    heart: Heart,
    home: Home,
    love: Heart,
    hug: Users,
    together: Users,
} as const;
