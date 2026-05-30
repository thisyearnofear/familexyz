import { cn } from "@/lib/utils";

interface FamilyLogoProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeMap = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
};

export function FamilyLogo({ size = "md", className }: FamilyLogoProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-center",
                sizeMap[size],
                className
            )}
            role="img"
            aria-label="FamilyXYZ Logo"
        >
            👨‍👩‍👧‍👦
        </div>
    );
}
