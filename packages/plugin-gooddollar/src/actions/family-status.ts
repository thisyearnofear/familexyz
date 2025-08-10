import {
  Action,
  ActionExample,
  Content,
  HandlerCallback,
  IAgentRuntime,
  Memory,
  State,
  elizaLogger,
} from "@elizaos/core";
import { IdentityService } from "../services/identity.js";

export const familyStatusAction: Action = {
  name: "FAMILY_STATUS",
  similes: [
    "FAMILY_VERIFICATION_STATUS",
    "CHECK_FAMILY",
    "FAMILY_INFO",
    "WHO_IS_VERIFIED",
    "FAMILY_MEMBERS",
    "VERIFICATION_REPORT",
  ],
  description: "Check family verification status, member roles, and UBI eligibility",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    const statusKeywords = [
      "status",
      "check",
      "info", 
      "report",
      "who is",
      "show me",
      "list",
    ];
    
    const familyKeywords = [
      "family",
      "members",
      "verified",
      "verification",
      "eligibility",
      "ubi",
    ];
    
    const hasStatus = statusKeywords.some(keyword => 
      content.includes(keyword)
    );
    const hasFamily = familyKeywords.some(keyword => 
      content.includes(keyword)
    );
    
    return hasStatus && hasFamily;
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("📊 Processing family status request");
      
      // Get Identity service
      const identityService = runtime.getService<IdentityService>(IdentityService);
      if (!identityService) {
        throw new Error("Identity service not available");
      }

      const familyId = message.roomId || "default_family";
      
      // Get family verification status
      const [familyMembers, verificationStatus] = await Promise.all([
        identityService.getFamilyMembers(familyId),
        identityService.getFamilyVerificationStatus(familyId),
      ]);

      if (familyMembers.length === 0) {
        const noMembersContent: Content = {
          text: `👥 **Family Status Report**\n\n` +
                `🏠 Family ID: ${familyId.slice(0, 8)}...\n` +
                `👤 Members: 0\n\n` +
                `No family members found. To get started:\n` +
                `1. Verify your identity with your wallet address\n` +
                `2. Invite other family members to join\n` +
                `3. Start earning G$ rewards for positive interactions!\n\n` +
                `Use: "Verify me as a [role] with wallet 0x..." to begin`,
          action: "FAMILY_STATUS",
        };
        callback?.(noMembersContent);
        return true;
      }

      // Build member status list
      const memberStatusList = familyMembers.map((member, index) => {
        const familyRelation = member.familyRelationships.find(rel => rel.familyId === familyId);
        const role = familyRelation?.role || 'member';
        const verificationEmoji = member.isVerified ? '✅' : '❌';
        const ubiEmoji = member.ubiEligible ? '💰' : '⛔';
        
        // Check if verification is expiring soon
        let expiryWarning = '';
        if (member.verificationData) {
          const daysUntilExpiry = (member.verificationData.expiryTime - Date.now()) / (1000 * 60 * 60 * 24);
          if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
            expiryWarning = ` ⚠️ (expires in ${Math.floor(daysUntilExpiry)}d)`;
          } else if (daysUntilExpiry <= 0) {
            expiryWarning = ` 🔴 (expired)`;
          }
        }
        
        return `${index + 1}. **${role.toUpperCase()}** ${verificationEmoji} ${ubiEmoji}\n` +
               `   └─ ${member.userId.slice(0, 8)}...${expiryWarning}\n` +
               `   └─ ${member.walletAddress.slice(0, 6)}...${member.walletAddress.slice(-4)}`;
      });

      // Calculate verification rate percentage
      const verificationRate = Math.round(verificationStatus.verificationRate * 100);
      
      // Build expiry warnings
      let expiryWarnings = '';
      if (verificationStatus.expiringSoon.length > 0) {
        expiryWarnings = `\n⚠️ **Expiring Soon:**\n` +
          verificationStatus.expiringSoon.map(userId => `• ${userId.slice(0, 8)}... (renew verification)`).join('\n');
      }

      // Build pending verifications
      let pendingVerifications = '';
      if (verificationStatus.pendingVerifications.length > 0) {
        pendingVerifications = `\n❌ **Pending Verifications:**\n` +
          verificationStatus.pendingVerifications.map(userId => `• ${userId.slice(0, 8)}... (needs verification)`).join('\n');
      }

      const statusContent: Content = {
        text: `👥 **Family Status Report**\n\n` +
              `🏠 Family: ${familyId.slice(0, 8)}...\n` +
              `👤 Total Members: ${verificationStatus.totalMembers}\n` +
              `✅ Verified: ${verificationStatus.verifiedMembers}/${verificationStatus.totalMembers} (${verificationRate}%)\n` +
              `💰 UBI Eligible: ${familyMembers.filter(m => m.ubiEligible).length}\n\n` +
              `**Family Members:**\n` +
              `${memberStatusList.join('\n\n')}\n` +
              `${expiryWarnings}${pendingVerifications}\n\n` +
              `**Legend:**\n` +
              `✅ Verified | ❌ Not Verified\n` +
              `💰 UBI Eligible | ⛔ Not Eligible\n\n` +
              `${verificationRate < 100 ? '💡 Complete family verification to unlock maximum G$ rewards!' : '🎉 Family fully verified! Earning maximum rewards!'}`,
        action: "FAMILY_STATUS",
        metadata: {
          familyId,
          totalMembers: verificationStatus.totalMembers,
          verifiedMembers: verificationStatus.verifiedMembers,
          verificationRate: verificationStatus.verificationRate,
          pendingCount: verificationStatus.pendingVerifications.length,
          expiringCount: verificationStatus.expiringSoon.length,
        },
      };

      elizaLogger.success(`📊 Family status reported: ${verificationStatus.totalMembers} members, ${verificationRate}% verified`);
      callback?.(statusContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ Family status check failed:", error);
      
      const errorContent: Content = {
        text: `Failed to get family status: ${error.message}\n\n` +
              `This might be due to:\n` +
              `• Identity service issues\n` +
              `• Network connectivity problems\n` +
              `• Database access issues\n\n` +
              `Please try again or contact support if the problem persists.`,
        action: "FAMILY_STATUS",
      };
      
      callback?.(errorContent);
      return false;
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: {
          text: "Show me our family verification status",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "👥 **Family Status Report**\n\n🏠 Family: family123...\n👤 Total Members: 4\n✅ Verified: 3/4 (75%)\n💰 UBI Eligible: 3\n\n**Family Members:**\n1. **PARENT** ✅ 💰\n   └─ parent123...\n   └─ 0x742d...b2E1\n\n2. **CHILD** ✅ 💰\n   └─ child456...\n   └─ 0x1234...5678\n\n3. **GRANDPARENT** ✅ 💰\n   └─ grandpa789... ⚠️ (expires in 5d)\n   └─ 0x9876...4321\n\n4. **SIBLING** ❌ ⛔\n   └─ sibling012...\n   └─ 0xabcd...efgh\n\n⚠️ **Expiring Soon:**\n• grandpa789... (renew verification)\n\n❌ **Pending Verifications:**\n• sibling012... (needs verification)\n\n**Legend:**\n✅ Verified | ❌ Not Verified\n💰 UBI Eligible | ⛔ Not Eligible\n\n💡 Complete family verification to unlock maximum G$ rewards!",
          action: "FAMILY_STATUS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Check who is verified in our family",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "👥 **Family Status Report**\n\n🏠 Family: family123...\n👤 Total Members: 2\n✅ Verified: 2/2 (100%)\n💰 UBI Eligible: 2\n\n**Family Members:**\n1. **PARENT** ✅ 💰\n   └─ parent123...\n   └─ 0x742d...b2E1\n\n2. **CHILD** ✅ 💰\n   └─ child456...\n   └─ 0x1234...5678\n\n**Legend:**\n✅ Verified | ❌ Not Verified\n💰 UBI Eligible | ⛔ Not Eligible\n\n🎉 Family fully verified! Earning maximum rewards!",
          action: "FAMILY_STATUS",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Family members report",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "👥 **Family Status Report**\n\n🏠 Family ID: family123...\n👤 Members: 0\n\nNo family members found. To get started:\n1. Verify your identity with your wallet address\n2. Invite other family members to join\n3. Start earning G$ rewards for positive interactions!\n\nUse: \"Verify me as a [role] with wallet 0x...\" to begin",
          action: "FAMILY_STATUS",
        },
      },
    ],
  ] as ActionExample[][],
};

export default familyStatusAction;