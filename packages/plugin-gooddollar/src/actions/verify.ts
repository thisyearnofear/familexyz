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
import { ethers } from "ethers";

export const verifyFamilyMemberAction: Action = {
  name: "VERIFY_FAMILY_MEMBER",
  similes: [
    "VERIFY_IDENTITY",
    "FACE_VERIFICATION",
    "FAMILY_VERIFICATION", 
    "JOIN_FAMILY",
    "REGISTER_FAMILY_MEMBER",
    "VERIFY_ME",
    "GET_VERIFIED",
  ],
  description: "Verify family member identity using face verification for UBI eligibility and sybil resistance",
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    const content = message.content.text.toLowerCase();
    
    const verificationKeywords = [
      "verify",
      "verification",
      "face verification",
      "identity",
      "register",
      "join family",
      "get verified",
      "prove identity",
    ];
    
    const familyKeywords = [
      "family",
      "member",
      "parent",
      "child",
      "grandparent",
      "sibling",
      "mom",
      "dad",
      "son", 
      "daughter",
    ];
    
    const hasVerification = verificationKeywords.some(keyword => 
      content.includes(keyword)
    );
    const hasFamily = familyKeywords.some(keyword => 
      content.includes(keyword)
    );
    
    return hasVerification || (hasFamily && content.includes("verify"));
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    options: any = {},
    callback?: HandlerCallback,
  ) => {
    try {
      elizaLogger.info("🔍 Processing family member verification request");
      
      // Get Identity service
      const identityService = runtime.getService<IdentityService>(IdentityService);
      if (!identityService) {
        throw new Error("Identity service not available");
      }

      const config = identityService.getConfig();
      
      // Extract verification details from message
      const verificationDetails = extractVerificationDetails(message.content.text);
      
      // Use message userId as default if no specific userId provided
      const userId = verificationDetails.userId || message.userId;
      const familyId = verificationDetails.familyId || message.roomId || "default_family";
      
      if (!verificationDetails.walletAddress) {
        const helpContent: Content = {
          text: "To verify your family member identity, I need your wallet address. Please provide:\n" +
                "• Your wallet address (0x...)\n" +
                "• Your family role (parent, child, grandparent, sibling)\n\n" +
                "Example: 'Verify me as a parent with wallet 0x1234567890abcdef1234567890abcdef12345678'",
          action: "VERIFY_FAMILY_MEMBER",
        };
        callback?.(helpContent);
        return false;
      }

      // Validate wallet address
      if (!ethers.isAddress(verificationDetails.walletAddress)) {
        const errorContent: Content = {
          text: `Invalid wallet address: ${verificationDetails.walletAddress}. Please provide a valid Ethereum address.`,
          action: "VERIFY_FAMILY_MEMBER",
        };
        callback?.(errorContent);
        return false;
      }

      // Check if user is already verified
      const existingProfile = await identityService.getIdentityProfile(userId);
      if (existingProfile?.isVerified) {
        // Check if verification is expiring soon
        const expiryTime = existingProfile.verificationData?.expiryTime || 0;
        const daysUntilExpiry = (expiryTime - Date.now()) / (1000 * 60 * 60 * 24);
        
        if (daysUntilExpiry > 7) {
          const alreadyVerifiedContent: Content = {
            text: `✅ You're already verified!\n\n` +
                  `👤 User ID: ${userId}\n` +
                  `🏠 Family Role: ${existingProfile.familyRelationships[0]?.role || 'member'}\n` +
                  `📅 Verification expires in ${Math.floor(daysUntilExpiry)} days\n` +
                  `🎯 UBI Eligible: ${existingProfile.ubiEligible ? 'Yes' : 'No'}\n\n` +
                  `You can claim your daily UBI and participate in family rewards!`,
            action: "VERIFY_FAMILY_MEMBER",
          };
          callback?.(alreadyVerifiedContent);
          return true;
        } else {
          // Verification expiring soon, offer renewal
          const renewalContent: Content = {
            text: `⚠️ Your verification expires in ${Math.floor(daysUntilExpiry)} days.\n\n` +
                  `Would you like to renew your verification now to maintain UBI eligibility?`,
            action: "VERIFY_FAMILY_MEMBER",
          };
          callback?.(renewalContent);
          return false;
        }
      }

      // Start verification process
      const processingContent: Content = {
        text: `🔍 Starting family member verification...\n\n` +
              `👤 User: ${userId}\n` +
              `💼 Role: ${verificationDetails.role}\n` +
              `🏠 Family: ${familyId.slice(0, 8)}...\n` +
              `📱 Wallet: ${verificationDetails.walletAddress.slice(0, 6)}...${verificationDetails.walletAddress.slice(-4)}\n\n` +
              `${config.enableFaceVerification ? '📸 Please complete the face verification process...' : '⚡ Processing verification...'}`,
        action: "VERIFY_FAMILY_MEMBER",
      };
      callback?.(processingContent);

      // Perform verification
      const verificationResult = await identityService.verifyFamilyMember(
        userId,
        verificationDetails.walletAddress,
        familyId,
        verificationDetails.role
      );

      if (!verificationResult.success) {
        const failureContent: Content = {
          text: `❌ Verification failed: ${verificationResult.error}\n\n` +
                `This could be due to:\n` +
                `• Poor lighting conditions\n` +
                `• Camera issues\n` +
                `• Network connectivity problems\n` +
                `• Duplicate identity detection\n\n` +
                `Please try again in good lighting with your face clearly visible.`,
          action: "VERIFY_FAMILY_MEMBER",
          metadata: {
            sessionId: verificationResult.sessionId,
            confidence: verificationResult.confidence,
          },
        };
        callback?.(failureContent);
        return false;
      }

      // Get updated profile
      const profile = await identityService.getIdentityProfile(userId);
      const familyRole = profile?.familyRelationships.find(rel => rel.familyId === familyId)?.role || verificationDetails.role;

      // Success response
      const successContent: Content = {
        text: `🎉 Family member verification successful!\n\n` +
              `✅ Identity verified with ${Math.round(verificationResult.confidence * 100)}% confidence\n` +
              `👤 User: ${userId}\n` +
              `💼 Family Role: ${familyRole}\n` +
              `🏠 Family ID: ${familyId.slice(0, 8)}...\n` +
              `🆔 Session: ${verificationResult.sessionId.slice(0, 12)}...\n\n` +
              `🎯 **Benefits Unlocked:**\n` +
              `• Daily UBI claiming eligibility\n` +
              `• Family reward participation\n` +
              `• Cross-generational bonus rewards\n` +
              `• Verified family member status\n\n` +
              `💡 You can now claim your daily UBI and start earning G$ rewards for positive family interactions!`,
        action: "VERIFY_FAMILY_MEMBER",
        metadata: {
          userId: userId,
          familyId: familyId,
          role: familyRole,
          sessionId: verificationResult.sessionId,
          confidence: verificationResult.confidence,
          timestamp: verificationResult.timestamp,
        },
      };

      elizaLogger.success(`✅ Family member verification completed: ${userId}`);
      callback?.(successContent);
      return true;

    } catch (error) {
      elizaLogger.error("❌ Family member verification failed:", error);
      
      const errorContent: Content = {
        text: `Verification failed: ${error.message}\n\n` +
              `This might be due to:\n` +
              `• Service configuration issues\n` +
              `• Network connectivity problems\n` +
              `• Temporary system issues\n\n` +
              `Please try again or contact support if the problem persists.`,
        action: "VERIFY_FAMILY_MEMBER",
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
          text: "I want to verify my identity as a parent with wallet 0x742d35Cc6634C0532925a3b8D451C05C7AE3b2E1",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🎉 Family member verification successful!\n\n✅ Identity verified with 97% confidence\n👤 User: user1\n💼 Family Role: parent\n🏠 Family ID: family123...\n🆔 Session: session_abc...\n\n🎯 **Benefits Unlocked:**\n• Daily UBI claiming eligibility\n• Family reward participation\n• Cross-generational bonus rewards\n• Verified family member status\n\n💡 You can now claim your daily UBI and start earning G$ rewards for positive family interactions!",
          action: "VERIFY_FAMILY_MEMBER",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "Can you verify me as a grandparent?",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "To verify your family member identity, I need your wallet address. Please provide:\n• Your wallet address (0x...)\n• Your family role (parent, child, grandparent, sibling)\n\nExample: 'Verify me as a parent with wallet 0x1234567890abcdef1234567890abcdef12345678'",
          action: "VERIFY_FAMILY_MEMBER",
        },
      },
    ],
    [
      {
        user: "{{user1}}",
        content: {
          text: "I need face verification to join my family with wallet 0x1234567890abcdef1234567890abcdef12345678 as a child",
        },
      },
      {
        user: "{{agentName}}",
        content: {
          text: "🔍 Starting family member verification...\n\n👤 User: user1\n💼 Role: child\n🏠 Family: room123...\n📱 Wallet: 0x1234...5678\n\n📸 Please complete the face verification process...",
          action: "VERIFY_FAMILY_MEMBER",
        },
      },
    ],
  ] as ActionExample[][],
};

interface VerificationDetails {
  userId?: string;
  walletAddress?: string;
  role: "parent" | "child" | "grandparent" | "sibling" | "other";
  familyId?: string;
}

function extractVerificationDetails(text: string): VerificationDetails {
  const details: VerificationDetails = {
    role: "other", // default role
  };
  
  // Extract wallet address (0x followed by 40 hex characters)
  const addressPattern = /0x[a-fA-F0-9]{40}/;
  const addressMatch = text.match(addressPattern);
  if (addressMatch) {
    details.walletAddress = addressMatch[0];
  }
  
  // Extract family role
  const rolePatterns = [
    { pattern: /\b(parent|mom|dad|mother|father)\b/i, role: "parent" as const },
    { pattern: /\b(child|son|daughter|kid)\b/i, role: "child" as const },
    { pattern: /\b(grandparent|grandma|grandpa|grandmother|grandfather|nana|papa)\b/i, role: "grandparent" as const },
    { pattern: /\b(sibling|sister|brother)\b/i, role: "sibling" as const },
  ];
  
  for (const { pattern, role } of rolePatterns) {
    if (pattern.test(text)) {
      details.role = role;
      break;
    }
  }
  
  // Extract family ID (if mentioned)
  const familyIdPattern = /family[:\s]+([a-zA-Z0-9_-]+)/i;
  const familyIdMatch = text.match(familyIdPattern);
  if (familyIdMatch) {
    details.familyId = familyIdMatch[1];
  }
  
  return details;
}

export default verifyFamilyMemberAction;