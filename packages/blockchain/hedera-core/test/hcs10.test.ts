import {
    HCS10FamilyInteraction,
    HCS10FamilyMilestone,
    HCS10FamilyReward,
    HCS10FamilyTopicRegistration,
    isHCS10Message,
    isHCS10FamilyInteraction,
    isHCS10FamilyMilestone,
    isHCS10FamilyReward,
    isHCS10FamilyTopicRegistration,
} from "../src/types/hcs10";

describe("HCS-10 Message Types", () => {
    test("should create valid HCS-10 family interaction message", () => {
        const interaction: HCS10FamilyInteraction = {
            standard: "HCS-10",
            version: "1.0",
            timestamp: Date.now(),
            messageId: "test_123",
            sender: "wisdom_agent",
            topicId: "0.0.123456",
            type: "family_interaction",
            payload: {
                familyId: "family_abc",
                agentType: "wisdom",
                interactionType: "wisdom_shared",
                contentHash: "hash123",
                participants: ["0.0.111", "0.0.222"],
                sentiment: {
                    polarity: 0.8,
                    familyTone: "positive",
                    healthScore: 85,
                },
                metadata: {
                    sessionId: "session_456",
                },
            },
        };

        expect(isHCS10Message(interaction)).toBe(true);
        expect(isHCS10FamilyInteraction(interaction)).toBe(true);
        expect(interaction.payload.sentiment.polarity).toBe(0.8);
    });

    test("should create valid HCS-10 family milestone message", () => {
        const milestone: HCS10FamilyMilestone = {
            standard: "HCS-10",
            version: "1.0",
            timestamp: Date.now(),
            messageId: "milestone_123",
            sender: "growth_agent",
            topicId: "0.0.123456",
            type: "family_milestone",
            payload: {
                familyId: "family_abc",
                agentType: "growth",
                milestoneType: "weekly_goal_achieved",
                description: "Family achieved their weekly communication goal",
                participants: ["0.0.111", "0.0.222"],
                rewardAmount: 500,
                metadata: {
                    goalId: "goal_789",
                },
            },
        };

        expect(isHCS10Message(milestone)).toBe(true);
        expect(isHCS10FamilyMilestone(milestone)).toBe(true);
        expect(milestone.payload.rewardAmount).toBe(500);
    });

    test("should create valid HCS-10 family reward message", () => {
        const reward: HCS10FamilyReward = {
            standard: "HCS-10",
            version: "1.0",
            timestamp: Date.now(),
            messageId: "reward_123",
            sender: "system",
            topicId: "0.0.123456",
            type: "family_reward",
            payload: {
                familyId: "family_abc",
                agentType: "wisdom",
                recipient: "0.0.111",
                amount: 1000,
                tokenId: "0.0.999999",
                reason: "conflict_resolved",
                transactionId: "0.0.123456@1234567890.000000000",
                metadata: {
                    interactionId: "interaction_456",
                },
            },
        };

        expect(isHCS10Message(reward)).toBe(true);
        expect(isHCS10FamilyReward(reward)).toBe(true);
        expect(reward.payload.amount).toBe(1000);
    });

    test("should create valid HCS-10 topic registration message", () => {
        const registration: HCS10FamilyTopicRegistration = {
            standard: "HCS-10",
            version: "1.0",
            timestamp: Date.now(),
            messageId: "reg_123",
            sender: "system",
            topicId: "0.0.123456",
            type: "topic_registration",
            payload: {
                familyId: "family_abc",
                topicId: "0.0.123456",
                adminKey: "302a300506032b6570032100...",
                memo: "Family interactions for family_abc",
                metadata: {
                    createdAt: Date.now(),
                },
            },
        };

        expect(isHCS10Message(registration)).toBe(true);
        expect(isHCS10FamilyTopicRegistration(registration)).toBe(true);
        expect(registration.payload.memo).toBe(
            "Family interactions for family_abc",
        );
    });
});
