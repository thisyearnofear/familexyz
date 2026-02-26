import { type Action, type Context, type AgentRuntime } from "@elizaos/core";

/**
 * Intimacy Plugin - Custom actions for deepening family bonds
 */
export class IntimacyPlugin {
    constructor() {}

    /**
     * Custom actions for the Intimacy agent
     */
    getActions(): Action[] {
        return [
            {
                name: "suggestConnectionActivity",
                description: "Suggest a specific activity to increase family connection",
                async execute(context: Context) {
                    const activities = [
                        "family game night with board games",
                        "cooking dinner together and sharing stories",
                        "family walk in nature and discussing feelings",
                        "creating a family gratitude journal",
                        "having a 'no devices' evening for conversation",
                        "sharing family photos and memories",
                        "doing a family art project together",
                        "having a family talent show",
                        "creating a family mission statement",
                        "practicing active listening exercises"
                    ];
                    
                    const activity = activities[Math.floor(Math.random() * activities.length)];
                    return {
                        text: `I have an idea to help your family connect better. How about a ${activity}? This could be a great way to create shared memories and strengthen your bonds. Would you like me to help set this up?`,
                        actions: [
                            {
                                name: "scheduleActivity",
                                description: "Schedule the suggested activity",
                                async execute() {
                                    return {
                                        text: "I've scheduled a family ${activity} for this weekend. I'll send reminders to everyone!",
                                        metadata: { scheduled: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "assessEmotionalTemperature",
                description: "Check the emotional state of the family",
                async execute(context: Context) {
                    const emotions = [
                        "happy and connected",
                        "stressed and overwhelmed",
                        "distant and disconnected",
                        "excited and energetic",
                        "sad or grieving",
                        "angry or frustrated",
                        "anxious or worried",
                        "content and peaceful"
                    ];
                    
                    const emotion = emotions[Math.floor(Math.random() * emotions.length)];
                    return {
                        text: `Based on our conversation, your family seems to be feeling ${emotion}. Is this accurate? Understanding your family's emotional state can help us find the best ways to support each other.`,
                        actions: [
                            {
                                name: "validateEmotion",
                                description: "Validate the assessed emotion",
                                async execute() {
                                    return {
                                        text: "Thank you for sharing. It's completely normal to feel this way. Would you like some specific strategies to help your family through this emotional state?",
                                        metadata: { validated: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestVulnerabilityExercise",
                description: "Propose an exercise to increase emotional intimacy",
                async execute(context: Context) {
                    const exercises = [
                        "share something you appreciate about each family member",
                        "discuss a challenge you overcame and what you learned",
                        "talk about your hopes and dreams for the family",
                        "share a childhood memory that shaped who you are",
                        "discuss what makes each person feel loved and appreciated",
                        "talk about a time you felt proud of a family member",
                        "share something you're afraid of and why",
                        "discuss what you value most in your family relationships"
                    ];
                    
                    const exercise = exercises[Math.floor(Math.random() * exercises.length)];
                    return {
                        text: `Here's an exercise that could help deepen your family's emotional intimacy: "${exercise}". This can create powerful moments of connection. Would you like to try this with your family?`,
                        actions: [
                            {
                                name: "facilitateExercise",
                                description: "Guide the family through the vulnerability exercise",
                                async execute() {
                                    return {
                                        text: "I'll guide you through the exercise. Let's start with the first person sharing their thoughts. Remember, this is a safe space for honest expression.",
                                        metadata: { facilitating: true }
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
            name: "intimacyContext",
            description: "Handles intimacy-related conversation contexts",
            async handle(context: Context) {
                const { message, agent } = context;
                
                // Check for intimacy-related topics
                const intimacyKeywords = [
                    "distant", "close", "connected", "disconnected", 
                    "intimate", "bond", "relationship", "emotion", 
                    "feeling", "vulnerable", "trust", "affection"
                ];
                
                const hasIntimacyTopic = intimacyKeywords.some(keyword => 
                    message.text.toLowerCase().includes(keyword)
                );
                
                if (hasIntimacyTopic) {
                    return {
                        text: "I'm here to help strengthen your family's emotional connections. Let's explore what's on your mind.",
                        actions: this.getActions().slice(0, 2) // Offer first two actions
                    };
                }
                
                return null;
            }
        });
    }
}

export const createIntimacyPlugin = () => new IntimacyPlugin();