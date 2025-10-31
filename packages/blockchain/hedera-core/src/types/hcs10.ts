/**
 * HCS-10 Compliant Message Types for Family Interactions
 *
 * HCS-10 is the Hedera Consensus Service standard for structured messaging
 * that enables interoperability between different applications and agents.
 */

export interface HCS10BaseMessage {
    standard: "HCS-10";
    version: "1.0";
    timestamp: number;
    messageId: string;
    sender: string;
    topicId: string;
}

export interface HCS10FamilyInteraction extends HCS10BaseMessage {
    type: "family_interaction";
    payload: {
        familyId: string;
        agentType: string;
        interactionType: string;
        contentHash: string;
        participants: string[];
        sentiment: {
            polarity: number;
            familyTone: string;
            healthScore: number;
        };
        metadata?: Record<string, any>;
    };
}

export interface HCS10FamilyMilestone extends HCS10BaseMessage {
    type: "family_milestone";
    payload: {
        familyId: string;
        agentType: string;
        milestoneType: string;
        description: string;
        participants: string[];
        rewardAmount?: number;
        metadata?: Record<string, any>;
    };
}

export interface HCS10FamilyReward extends HCS10BaseMessage {
    type: "family_reward";
    payload: {
        familyId: string;
        agentType: string;
        recipient: string;
        amount: number;
        tokenId?: string;
        reason: string;
        transactionId?: string;
        metadata?: Record<string, any>;
    };
}

export interface HCS10FamilyTopicRegistration extends HCS10BaseMessage {
    type: "topic_registration";
    payload: {
        familyId: string;
        topicId: string;
        adminKey?: string;
        memo: string;
        metadata?: Record<string, any>;
    };
}

export type HCS10FamilyMessage =
    | HCS10FamilyInteraction
    | HCS10FamilyMilestone
    | HCS10FamilyReward
    | HCS10FamilyTopicRegistration;

// Message validation utilities
export function isHCS10Message(obj: any): obj is HCS10BaseMessage {
    return (
        obj &&
        obj.standard === "HCS-10" &&
        obj.version === "1.0" &&
        typeof obj.timestamp === "number" &&
        typeof obj.messageId === "string" &&
        typeof obj.sender === "string" &&
        typeof obj.topicId === "string"
    );
}

export function isHCS10FamilyInteraction(
    obj: any,
): obj is HCS10FamilyInteraction {
    return isHCS10Message(obj) && obj.type === "family_interaction";
}

export function isHCS10FamilyMilestone(obj: any): obj is HCS10FamilyMilestone {
    return isHCS10Message(obj) && obj.type === "family_milestone";
}

export function isHCS10FamilyReward(obj: any): obj is HCS10FamilyReward {
    return isHCS10Message(obj) && obj.type === "family_reward";
}

export function isHCS10FamilyTopicRegistration(
    obj: any,
): obj is HCS10FamilyTopicRegistration {
    return isHCS10Message(obj) && obj.type === "topic_registration";
}
