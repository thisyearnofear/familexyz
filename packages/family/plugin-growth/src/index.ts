import { type Action, type Context, type AgentRuntime } from "@elizaos/core";

/**
 * Growth Plugin - Custom actions for family development and resilience
 */
export class GrowthPlugin {
    constructor() {}

    /**
     * Custom actions for the Growth agent
     */
    getActions(): Action[] {
        return [
            {
                name: "reframeFixedMindset",
                description: "Help reframe fixed mindset statements into growth mindset",
                async execute(context: Context) {
                    const fixedStatements = [
                        "I can't do this",
                        "This is too hard",
                        "I'm not good at this",
                        "I give up",
                        "I'll never learn this",
                        "I made a mistake",
                        "This isn't working",
                        "I'm not smart enough"
                    ];
                    
                    const growthReframes = [
                        "I can't do this YET, but I'm learning",
                        "This is challenging, and challenges help me grow",
                        "I'm not good at this... YET. With practice, I'll improve",
                        "I'll try a different strategy instead of giving up",
                        "I haven't learned this... YET, but I'm making progress",
                        "Mistakes are how I learn. What can I learn from this?",
                        "This isn't working... YET. Let me try another approach",
                        "I'm not smart enough... YET. My brain is growing with each attempt"
                    ];
                    
                    const randomIndex = Math.floor(Math.random() * fixedStatements.length);
                    const fixedStatement = fixedStatements[randomIndex];
                    const growthReframe = growthReframes[randomIndex];
                    
                    return {
                        text: `When you said "${fixedStatement}", I heard a fixed mindset statement. Let's reframe that: "${growthReframe}". This is how we turn challenges into opportunities for growth!`,
                        actions: [
                            {
                                name: "practiceReframing",
                                description: "Practice reframing fixed mindset statements",
                                async execute() {
                                    return {
                                        text: "Let's practice together! Give me another statement you or your family member said that might be fixed mindset, and I'll help reframe it.",
                                        metadata: { practicing: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "celebrateEffort",
                description: "Celebrate effort and progress, not just results",
                async execute(context: Context) {
                    const effortStatements = [
                        "I worked really hard on this even though it's not perfect",
                        "I kept trying different approaches until I figured it out",
                        "I asked for help when I was stuck",
                        "I practiced this every day this week",
                        "I tried something new even though I was nervous",
                        "I learned from my mistakes and improved",
                        "I helped my sibling understand this concept",
                        "I stayed focused even when it got difficult"
                    ];
                    
                    const celebration = effortStatements[Math.floor(Math.random() * effortStatements.length)];
                    return {
                        text: `That's fantastic growth mindset in action! "${celebration}" is exactly the kind of effort that leads to real progress. Let's celebrate this milestone!`,
                        actions: [
                            {
                                name: "growthCelebration",
                                description: "Celebrate growth with a family ritual",
                                async execute() {
                                    return {
                                        text: "How about a family 'growth celebration'? Each person shares one effort they're proud of this week. I'll help track your family's growth over time!",
                                        metadata: { celebrating: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestLearningChallenge",
                description: "Propose a family learning challenge",
                async execute(context: Context) {
                    const challenges = [
                        "learn a new family recipe together",
                        "build something as a family using recycled materials",
                        "learn 10 words in a new language",
                        "create a family science experiment",
                        "write and perform a short family play",
                        "learn basic coding concepts together",
                        "start a family book club",
                        "learn a new sport or physical activity",
                        "create a family garden and track plant growth",
                        "learn basic first aid skills together"
                    ];
                    
                    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
                    return {
                        text: `Here's a growth challenge for your family: "${challenge}". This is a perfect opportunity to practice persistence, learn together, and celebrate progress. Ready to level up as a family?`,
                        actions: [
                            {
                                name: "startChallenge",
                                description: "Begin the learning challenge",
                                async execute() {
                                    return {
                                        text: "I've scheduled this challenge for this weekend. I'll provide step-by-step guidance and help track your family's progress. Let's grow together!",
                                        metadata: { challenging: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            }
        ];
    }

    /**
     * Initialize the plugin with the agent runtime
     */
    async initialize(runtime: AgentRuntime) {
        // Add custom actions to the agent
        const actions = this.getActions();
        for (const action of actions) {
            runtime.addAction(action);
        }
        
        // Add custom context handlers
        runtime.addContextHandler({
            name: "growthContext",
            description: "Handles growth mindset conversation contexts",
            async handle(context: Context) {
                const { message, agent } = context;
                
                // Check for growth mindset related topics
                const growthKeywords = [
                    "can't", "hard", "difficult", "impossible", 
                    "give up", "quit", "fail", "mistake", 
                    "learn", "improve", "practice", "progress", 
                    "challenge", "effort", "try", "persist"
                ];
                
                const hasGrowthTopic = growthKeywords.some(keyword => 
                    message.text.toLowerCase().includes(keyword)
                );
                
                if (hasGrowthTopic) {
                    return {
                        text: "I'm here to help your family develop a growth mindset. Every challenge is an opportunity to learn and grow stronger together.",
                        actions: this.getActions().slice(0, 2) // Offer first two actions
                    };
                }
                
                return null;
            }
        });
    }
}

export const createGrowthPlugin = () => new GrowthPlugin();