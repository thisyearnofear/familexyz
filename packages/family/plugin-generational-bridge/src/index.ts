import { type Action, type Context, type AgentRuntime } from "@elizaos/core";

/**
 * GenerationalBridge Plugin - Custom actions for uniting family generations
 */
export class GenerationalBridgePlugin {
    constructor() {}

    /**
     * Custom actions for the GenerationalBridge agent
     */
    getActions(): Action[] {
        return [
            {
                name: "suggestStorySharing",
                description: "Propose a story-sharing activity between generations",
                async execute(context: Context) {
                    const storyPrompts = [
                        "share a story about your first job and what you learned",
                        "talk about a family tradition from your childhood",
                        "share a story about overcoming a challenge",
                        "discuss how technology has changed your life",
                        "share a story about a family celebration that was special",
                        "talk about a lesson you learned from a parent or grandparent",
                        "share a story about moving to a new place or starting over",
                        "discuss what family means to you and how that's evolved",
                        "share a story about a time you helped someone in your family",
                        "talk about a hobby or interest you had as a young person"
                    ];
                    
                    const prompt = storyPrompts[Math.floor(Math.random() * storyPrompts.length)];
                    return {
                        text: `Here's a story-sharing prompt that could bridge generations: "${prompt}". This is a perfect way to discover shared experiences across age gaps. Would you like to facilitate this with your family?`,
                        actions: [
                            {
                                name: "facilitateStorySharing",
                                description: "Guide the family through story-sharing",
                                async execute() {
                                    return {
                                        text: "I'll help you set up a story-sharing session. Let's start by having the oldest and youngest family members share first, then others can join in. I'll provide prompts to keep the conversation flowing.",
                                        metadata: { facilitating: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestTraditionModernization",
                description: "Help modernize old traditions while preserving meaning",
                async execute(context: Context) {
                    const traditionAreas = [
                        "holiday celebrations",
                        "family recipes",
                        "gathering activities",
                        "photo sharing",
                        "story preservation",
                        "skill sharing",
                        "music and entertainment",
                        "communication methods"
                    ];
                    
                    const tradition = traditionAreas[Math.floor(Math.random() * traditionAreas.length)];
                    return {
                        text: `Let's modernize a ${tradition} tradition while keeping its heart. For example, we could digitize old family recipes, create video stories instead of written ones, or use video calls to include distant family members. What tradition would you like to update?`,
                        actions: [
                            {
                                name: "modernizeTradition",
                                description: "Create a modernized version of a tradition",
                                async execute() {
                                    return {
                                        text: "I've created a modernized version of your tradition that keeps the meaning but adds new elements. Let's try it this weekend and see how it feels!",
                                        metadata: { modernizing: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestIntergenerationalLearning",
                description: "Propose mutual learning between generations",
                async execute(context: Context) {
                    const learningPairs = [
                        "grandparent teaches grandchild to cook a family recipe",
                        "teen teaches grandparent how to video call",
                        "parent shares career advice while child shares new technology insights",
                        "grandparent teaches traditional craft while grandchild teaches digital design",
                        "family member shares historical knowledge while younger member shares current events context",
                        "elder teaches financial wisdom while younger teaches budgeting apps",
                        "grandparent shares gardening knowledge while grandchild teaches plant identification apps",
                        "family member teaches traditional music while younger teaches music production"
                    ];
                    
                    const learningPair = learningPairs[Math.floor(Math.random() * learningPairs.length)];
                    return {
                        text: `Here's a mutual learning opportunity: "${learningPair}". This creates respect and understanding when both generations teach and learn from each other. Ready to set this up?`,
                        actions: [
                            {
                                name: "startLearningExchange",
                                description: "Begin the intergenerational learning exchange",
                                async execute() {
                                    return {
                                        text: "I've scheduled a learning exchange session. I'll provide conversation starters and help track what each person teaches and learns. This builds respect across generations!",
                                        metadata: { learning: true }
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
            name: "generationalContext",
            description: "Handles intergenerational conversation contexts",
            async handle(context: Context) {
                const { message, agent } = context;
                
                // Check for generational topics
                const generationalKeywords = [
                    "grandparent", "grandchild", "teen", "elder", 
                    "tradition", "story", "history", "generation", 
                    "age", "old", "young", "respect", "understand", 
                    "bridge", "gap", "different", "past", "future"
                ];
                
                const hasGenerationalTopic = generationalKeywords.some(keyword => 
                    message.text.toLowerCase().includes(keyword)
                );
                
                if (hasGenerationalTopic) {
                    return {
                        text: "I'm here to help your family build bridges across generations. Every age has wisdom to share and lessons to learn.",
                        actions: this.getActions().slice(0, 2) // Offer first two actions
                    };
                }
                
                return null;
            }
        });
    }
}

export const createGenerationalBridgePlugin = () => new GenerationalBridgePlugin();