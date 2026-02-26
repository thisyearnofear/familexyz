import { type Action, type Context, type AgentRuntime } from "@elizaos/core";

/**
 * Presence Plugin - Custom actions for digital wellness and mindful attention
 */
export class PresencePlugin {
    constructor() {}

    /**
     * Custom actions for the Presence agent
     */
    getActions(): Action[] {
        return [
            {
                name: "suggestDeviceFreeTime",
                description: "Propose a device-free family activity",
                async execute(context: Context) {
                    const deviceFreeActivities = [
                        "family walk in nature without phones",
                        "board game night with all devices in another room",
                        "cooking dinner together with phones away",
                        "family reading hour with physical books",
                        "outdoor picnic without any devices",
                        "art or craft project together",
                        "family exercise or yoga session",
                        "gardening or outdoor work together",
                        "playing music or singing together",
                        "having a device-free conversation about dreams and goals"
                    ];
                    
                    const activity = deviceFreeActivities[Math.floor(Math.random() * deviceFreeActivities.length)];
                    return {
                        text: `Here's a way to create real presence: "${activity}". This gives your family a chance to truly see and hear each other without digital distractions. Ready to try this?`,
                        actions: [
                            {
                                name: "scheduleDeviceFreeTime",
                                description: "Schedule the device-free activity",
                                async execute() {
                                    return {
                                        text: "I've scheduled this device-free time for this evening. I'll send reminders to everyone to put their devices away. Let's create some real connection!",
                                        metadata: { scheduling: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestMindfulMoment",
                description: "Propose a brief mindfulness practice",
                async execute(context: Context) {
                    const mindfulPractices = [
                        "take three deep breaths together and notice how you feel",
                        "do a one-minute silent meditation focusing on sounds around you",
                        "practice mindful eating by really tasting your food",
                        "do a body scan meditation noticing physical sensations",
                        "practice gratitude by sharing one thing you're thankful for",
                        "do a mindful walk noticing sights, sounds, and smells",
                        "practice loving-kindness meditation sending good wishes to each other",
                        "do a mindful listening exercise where one person speaks and others truly listen"
                    ];
                    
                    const practice = mindfulPractices[Math.floor(Math.random() * mindfulPractices.length)];
                    return {
                        text: `Here's a simple way to bring more presence: "${practice}". This only takes a few minutes but can create a big shift in how connected you feel. Want to try this now?`,
                        actions: [
                            {
                                name: "practiceMindfulness",
                                description: "Guide the family through the mindfulness practice",
                                async execute() {
                                    return {
                                        text: "I'll guide you through this practice. Let's all get comfortable and I'll lead us step by step. Remember, it's about being present, not being perfect.",
                                        metadata: { practicing: true }
                                    };
                                }
                            }
                        ]
                    };
                }
            },
            {
                name: "suggestDigitalBoundaries",
                description: "Propose healthy digital boundaries for the family",
                async execute(context: Context) {
                    const boundaryIdeas = [
                        "create a 'phone basket' for meals where everyone puts devices away",
                        "establish device-free zones in the house (like bedrooms or living room)",
                        "set specific times when devices are put away (like 7-8pm family time)",
                        "create a charging station outside bedrooms to reduce nighttime use",
                        "establish a 'first hour' rule where no devices are used for the first hour after waking",
                        "create a family agreement about device use during quality time",
                        "set up app limits or screen time controls together",
                        "establish a 'tech sabbath' one day a week with minimal device use"
                    ];
                    
                    const boundary = boundaryIdeas[Math.floor(Math.random() * boundaryIdeas.length)];
                    return {
                        text: `Here's a healthy digital boundary to try: "${boundary}". This creates space for real connection while still allowing device use when it's appropriate. Ready to set this up?`,
                        actions: [
                            {
                                name: "implementBoundary",
                                description: "Help implement the digital boundary",
                                async execute() {
                                    return {
                                        text: "I've created a plan for implementing this boundary. I'll help you set it up and send reminders to keep everyone accountable. Small changes create big improvements in presence!",
                                        metadata: { implementing: true }
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
            name: "presenceContext",
            description: "Handles presence and mindfulness conversation contexts",
            async handle(context: Context) {
                const { message, agent } = context;
                
                // Check for presence-related topics
                const presenceKeywords = [
                    "phone", "device", "screen", "distracted", 
                    "present", "attention", "mindful", "focus", 
                    "connect", "listen", "see", "eye contact", 
                    "quality time", "device-free", "mindfulness"
                ];
                
                const hasPresenceTopic = presenceKeywords.some(keyword => 
                    message.text.toLowerCase().includes(keyword)
                );
                
                if (hasPresenceTopic) {
                    return {
                        text: "I'm here to help your family create more real presence. Every moment of full attention is a gift to your loved ones.",
                        actions: this.getActions().slice(0, 2) // Offer first two actions
                    };
                }
                
                return null;
            }
        });
    }
}

export const createPresencePlugin = () => new PresencePlugin();