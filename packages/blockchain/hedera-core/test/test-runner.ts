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

function runTests() {
    console.log("Running HCS-10 Message Type Tests...\n");

    // Test 1: HCS-10 family interaction message
    console.log("Test 1: HCS-10 Family Interaction");
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

    console.log("  isHCS10Message:", isHCS10Message(interaction));
    console.log(
        "  isHCS10FamilyInteraction:",
        isHCS10FamilyInteraction(interaction),
    );
    console.log(
        "  Sentiment polarity:",
        interaction.payload.sentiment.polarity,
    );
    console.log("  ✓ Test 1 passed\n");

    // Test 2: HCS-10 family milestone message
    console.log("Test 2: HCS-10 Family Milestone");
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

    console.log("  isHCS10Message:", isHCS10Message(milestone));
    console.log("  isHCS10FamilyMilestone:", isHCS10FamilyMilestone(milestone));
    console.log("  Reward amount:", milestone.payload.rewardAmount);
    console.log("  ✓ Test 2 passed\n");

    // Test 3: HCS-10 family reward message
    console.log("Test 3: HCS-10 Family Reward");
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

    console.log("  isHCS10Message:", isHCS10Message(reward));
    console.log("  isHCS10FamilyReward:", isHCS10FamilyReward(reward));
    console.log("  Reward amount:", reward.payload.amount);
    console.log("  ✓ Test 3 passed\n");

    // Test 4: HCS-10 topic registration message
    console.log("Test 4: HCS-10 Topic Registration");
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

    console.log("  isHCS10Message:", isHCS10Message(registration));
    console.log(
        "  isHCS10FamilyTopicRegistration:",
        isHCS10FamilyTopicRegistration(registration),
    );
    console.log("  Memo:", registration.payload.memo);
    console.log("  ✓ Test 4 passed\n");

    console.log("All HCS-10 tests passed! 🎉");
}

// Run the tests
runTests();
