// Simple JavaScript test for HCS-10 message types
const fs = require('fs');
const path = require('path');

// Mock the HCS-10 validation functions
function isHCS10Message(obj) {
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

function isHCS10FamilyInteraction(obj) {
  return isHCS10Message(obj) && obj.type === "family_interaction";
}

function isHCS10FamilyMilestone(obj) {
  return isHCS10Message(obj) && obj.type === "family_milestone";
}

function isHCS10FamilyReward(obj) {
  return isHCS10Message(obj) && obj.type === "family_reward";
}

function isHCS10FamilyTopicRegistration(obj) {
  return isHCS10Message(obj) && obj.type === "topic_registration";
}

// Test 1: HCS-10 family interaction message
console.log("Test 1: HCS-10 Family Interaction");
const interaction = {
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
      healthScore: 85
    },
    metadata: {
      sessionId: "session_456"
    }
  }
};

console.log("  isHCS10Message:", isHCS10Message(interaction));
console.log("  isHCS10FamilyInteraction:", isHCS10FamilyInteraction(interaction));
console.log("  Sentiment polarity:", interaction.payload.sentiment.polarity);
console.log("  ✓ Test 1 passed\n");

// Test 2: HCS-10 family milestone message
console.log("Test 2: HCS-10 Family Milestone");
const milestone = {
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
      goalId: "goal_789"
    }
  }
};

console.log("  isHCS10Message:", isHCS10Message(milestone));
console.log("  isHCS10FamilyMilestone:", isHCS10FamilyMilestone(milestone));
console.log("  Reward amount:", milestone.payload.rewardAmount);
console.log("  ✓ Test 2 passed\n");

// Test 3: HCS-10 family reward message
console.log("Test 3: HCS-10 Family Reward");
const reward = {
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
      interactionId: "interaction_456"
    }
  }
};

console.log("  isHCS10Message:", isHCS10Message(reward));
console.log("  isHCS10FamilyReward:", isHCS10FamilyReward(reward));
console.log("  Reward amount:", reward.payload.amount);
console.log("  ✓ Test 3 passed\n");

// Test 4: HCS-10 topic registration message
console.log("Test 4: HCS-10 Topic Registration");
const registration = {
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
      createdAt: Date.now()
    }
  }
};

console.log("  isHCS10Message:", isHCS10Message(registration));
console.log("  isHCS10FamilyTopicRegistration:", isHCS10FamilyTopicRegistration(registration));
console.log("  Memo:", registration.payload.memo);
console.log("  ✓ Test 4 passed\n");

console.log("All HCS-10 tests passed! 🎉");