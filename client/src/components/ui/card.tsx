import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "gleam" | "electric" | "premium";
    glowColor?: string;
    animated?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", glowColor = "#8B5CF6", animated = true, ...props }, ref) => {
        const [isHovered, setIsHovered] = React.useState(false);

        const cardVariants = {
            default: "bg-card border shadow-sm",
            gleam: `
                relative overflow-hidden bg-gradient-to-br from-white/90 to-white/70
                border border-white/20 backdrop-blur-sm shadow-lg
                before:absolute before:inset-0 before:bg-gradient-to-r
                before:from-transparent before:via-white/30 before:to-transparent
                before:translate-x-[-100%] before:transition-transform before:duration-700
                hover:before:translate-x-[100%]
            `,
            electric: `
                relative bg-gradient-to-br from-slate-900/90 to-slate-800/90
                border-2 border-transparent backdrop-blur-sm shadow-xl
                before:absolute before:inset-0 before:p-[2px] before:bg-gradient-to-r
                before:from-purple-500 before:via-pink-500 before:to-purple-500
                before:rounded-xl before:animate-pulse
                after:absolute after:inset-[2px] after:bg-slate-900/95 after:rounded-lg
            `,
            premium: `
                relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30
                border border-purple-200/50 backdrop-blur-sm shadow-xl
                before:absolute before:inset-0 before:bg-gradient-to-r
                before:from-transparent before:via-purple-200/20 before:to-transparent
                before:translate-x-[-100%] before:transition-transform before:duration-1000
                hover:before:translate-x-[100%] hover:shadow-2xl
            `
        };

        if (animated) {
            const {
                onDrag,
                onDragStart,
                onDragEnd,
                onAnimationStart,
                onAnimationEnd,
                onAnimationIteration,
                ...divProps
            } = props;

            return (
                <motion.div
                    ref={ref}
                    role="region"
                    aria-label="Card"
                    className={cn(
                        "rounded-xl transition-all duration-300 relative text-card-foreground",
                        cardVariants[variant],
                        className
                    )}
                    style={{
                        boxShadow: isHovered && variant === "electric"
                            ? `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20`
                            : undefined
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    whileHover={{
                        scale: variant === "electric" ? 1.02 : 1.01,
                        y: -2
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    {...divProps}
                >
                    {variant === "electric" && (
                        <div
                            className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                            style={{
                                background: `radial-gradient(circle at center, ${glowColor}40, transparent 70%)`
                            }}
                        />
                    )}
                    <div className={variant === "electric" ? "relative z-10" : ""}>
                        {props.children}
                    </div>
                </motion.div>
            );
        }

        return (
            <div
                ref={ref}
                role="region"
                aria-label="Card"
                className={cn(
                    "rounded-xl transition-all duration-300 relative text-card-foreground",
                    cardVariants[variant],
                    className
                )}
                style={{
                    boxShadow: isHovered && variant === "electric"
                        ? `0 0 30px ${glowColor}40, 0 0 60px ${glowColor}20`
                        : undefined
                }}
                {...props}
            >
                {variant === "electric" && (
                    <div
                        className="absolute inset-0 rounded-xl opacity-20 blur-xl"
                        style={{
                            background: `radial-gradient(circle at center, ${glowColor}40, transparent 70%)`
                        }}
                    />
                )}
                <div className={variant === "electric" ? "relative z-10" : ""}>
                    {props.children}
                </div>
            </div>
        );
    }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        role="heading"
        aria-level={2}
        className={cn("flex flex-col space-y-1.5 p-6", className)}
        {...props}
    />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
    />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("p-6 pt-0", className)}
        {...props}
    />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn("flex items-center p-6 pt-0", className)}
        {...props}
    />
));
CardFooter.displayName = "CardFooter";

export {
    Card,
    CardHeader,
    CardFooter,
    CardTitle,
    CardDescription,
    CardContent,
};
