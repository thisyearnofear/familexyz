import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                default:
                    "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-lg focus-visible:ring-primary",
                destructive:
                    "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-lg focus-visible:ring-destructive",
                outline:
                    "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md focus-visible:ring-accent",
                secondary:
                    "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md focus-visible:ring-secondary",
                ghost: "hover:bg-accent hover:text-accent-foreground focus-visible:ring-accent",
                link: "text-primary underline-offset-4 hover:underline focus-visible:ring-primary",
                premium:
                    "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg hover:from-purple-600 hover:to-pink-600 hover:shadow-xl hover:scale-105 focus-visible:ring-purple-500",
                electric:
                    "relative bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-500 focus-visible:ring-indigo-500",
                gleam: "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg hover:from-amber-500 hover:to-orange-600 hover:shadow-xl relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700 focus-visible:ring-amber-500",
            },
            size: {
                default: "h-9 px-4 py-2",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "size-9 rounded-md",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    animated?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            animated = true,
            ...props
        },
        ref,
    ) => {
        if (asChild) {
            return (
                <Slot
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    {...props}
                />
            );
        }

        if (animated) {
            const {
                onDrag,
                onDragStart,
                onDragEnd,
                onAnimationStart,
                onAnimationEnd,
                onAnimationIteration,
                ...buttonProps
            } = props;

            return (
                <motion.button
                    type="button"
                    className={cn(buttonVariants({ variant, size, className }))}
                    ref={ref}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    {...buttonProps}
                />
            );
        }

        return (
            <button
                type="button"
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };
