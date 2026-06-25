import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
        "./lib/**/*.{ts,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            colors: {
                editorial: {
                    bg: "#1a1614",
                    cream: "#e8e0d8",
                    dim: "#c8c0b8",
                    muted: "#b0a8a0",
                    subtle: "#706b63",
                    faint: "#504a42",
                    accent: "#c4542b",
                    surface: "#2d2a24",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                sidebar: {
                    DEFAULT: "hsl(var(--sidebar-background))",
                    foreground: "hsl(var(--sidebar-foreground))",
                    primary: "hsl(var(--sidebar-primary))",
                    "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
                    accent: "hsl(var(--sidebar-accent))",
                    "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
                    border: "hsl(var(--sidebar-border))",
                    ring: "hsl(var(--sidebar-ring))",
                },
            },
            fontSize: {
                "display": ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
                "headline": ["clamp(1.5rem, 3vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.01em" }],
                "body-lg": ["1.125rem", { lineHeight: "1.7" }],
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "skel-pulse": "t-skel-pulse var(--pulse-dur) ease-in-out var(--pulse-count)",
                shimmer: "t-shimmer var(--shimmer-dur) linear infinite",
                "fade-in": "revealUp var(--duration-slow) var(--ease-smooth-out) both",
                "scale-in": "revealScale var(--duration-slow) var(--ease-smooth-out) both",
            },
            transitionDuration: {
                stagger: "40ms",
                micro: "80ms",
                quick: "150ms",
                fast: "250ms",
                medium: "350ms",
                slow: "400ms",
                "very-slow": "500ms",
            },
            transitionTimingFunction: {
                "smooth-out": "cubic-bezier(0.22, 1, 0.36, 1)",
                bounce: "cubic-bezier(0.34, 1.36, 0.64, 1)",
            },
            backgroundImage: {
                shimmer: "linear-gradient(90deg, var(--shimmer-base) 25%, var(--shimmer-highlight) 50%, var(--shimmer-base) 75%)",
            },
            backgroundSize: {
                shimmer: "400% 100%",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
