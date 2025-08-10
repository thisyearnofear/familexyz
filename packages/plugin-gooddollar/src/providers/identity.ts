import {
  IAgentRuntime,
  Provider,
  elizaLogger,
} from "@elizaos/core";
import { IdentityService } from "../services/identity.js";

const IDENTITY_TEMPLATE = `# GoodDollar Identity & Family Verification Status

## Current User Identity
- **User ID**: {{userId}}
- **Verification Status**: {{verificationStatus}}
- **UBI Eligible**: {{ubiEligible}}
- **Verification Confidence**: {{verificationConfidence}}%
- **Verification Expires**: {{verificationExpiry}}

## Family Relationships
{{familyRelationships}}

## Sybil Resistance Status
- **Uniqueness Verified**: {{uniquenessStatus}}
- **Identity Confidence**: {{identityConfidence}}%
- **Duplicate Profiles Found**: {{duplicateProfiles}}

## Verification Requirements
{{verificationRequirements}}

## Family Verification Overview
- **Total Family Members**: {{totalFamilyMembers}}
- **Verified Members**: {{verifiedMembers}}/{{totalFamilyMembers}} ({{verificationRate}}%)
- **Pending Verifications**: {{pendingVerifications}}
- **Expiring Soon**: {{expiringSoon}}

## Privacy & Security
- **Face Data**: Anonymized and encrypted
- **Identity Hash**: {{identityHash}}
- **Verification Method**: FaceTec 3D Liveness + Uniqueness Check
- **Data Retention**: 90 days (renewable)
- **Family Data Ownership**: Decentralized on Hedera HCS

## Next Actions
{{nextActions}}
`;

export const identityProvider: Provider = {
  get: async (runtime: IAgentRuntime, message?, state?): Promise<string> => {
    try {
      // Get Identity service
      const identityService = runtime.getService<IdentityService>(IdentityService);
      if (!identityService) {
        elizaLogger.warn("Identity service not available");
        return "Identity service not available. Face verification and family verification features are disabled.";
      }

      // Get user ID from message or use default
      const userId = message?.userId || "unknown_user";
      const familyId = message?.roomId || "default_family";

      // Get user's identity profile
      const userProfile = await identityService.getIdentityProfile(userId);
      
      // Get family verification status
      const familyStatus = await identityService.getFamilyVerificationStatus(familyId);
      
      // Get sybil resistance status
      const sybilCheck = await identityService.checkSybilResistance(userId);

      // Format verification status
      const verificationStatus = userProfile?.isVerified ? "✅ Verified" : "❌ Not Verified";
      const ubiEligible = userProfile?.ubiEligible ? "Yes" : "No";
      
      // Calculate verification confidence
      let verificationConfidence = "0";
      if (userProfile?.verificationData) {
        verificationConfidence = "95"; // Mock confidence score
      }

      // Format verification expiry
      let verificationExpiry = "Never verified";
      if (userProfile?.verificationData) {
        const expiryDate = new Date(userProfile.verificationData.expiryTime);
        const daysUntilExpiry = (userProfile.verificationData.expiryTime - Date.now()) / (1000 * 60 * 60 * 24);
        verificationExpiry = `${expiryDate.toLocaleDateString()} (${Math.floor(daysUntilExpiry)} days)`;
      }

      // Format family relationships
      let familyRelationships = "No family relationships found";
      if (userProfile?.familyRelationships && userProfile.familyRelationships.length > 0) {
        familyRelationships = userProfile.familyRelationships.map((rel, index) => 
          `${index + 1}. **${rel.role.toUpperCase()}** in family ${rel.familyId.slice(0, 8)}...${rel.verifiedBy ? ' (verified)' : ' (pending)'}`
        ).join('\n');
      }

      // Format uniqueness status
      const uniquenessStatus = sybilCheck.isUnique ? "✅ Unique Identity" : "❌ Duplicate Detected";
      const identityConfidence = Math.round(sybilCheck.confidence * 100);
      const duplicateProfiles = sybilCheck.similarProfiles.length > 0 
        ? sybilCheck.similarProfiles.join(', ') 
        : "None detected";

      // Format verification requirements
      let verificationRequirements = "";
      if (!userProfile?.isVerified) {
        verificationRequirements = `⚠️ **To get verified:**
1. Provide your wallet address
2. Specify your family role (parent, child, grandparent, sibling)
3. Complete face verification (good lighting required)
4. Pass uniqueness check (sybil resistance)

Example: "Verify me as a parent with wallet 0x1234..."`;
      } else {
        const daysUntilExpiry = userProfile.verificationData 
          ? (userProfile.verificationData.expiryTime - Date.now()) / (1000 * 60 * 60 * 24)
          : 0;
        
        if (daysUntilExpiry <= 7) {
          verificationRequirements = `⚠️ **Verification expiring soon!**
Your verification expires in ${Math.floor(daysUntilExpiry)} days.
Use: "Renew my verification" to maintain UBI eligibility.`;
        } else {
          verificationRequirements = `✅ **All requirements met**
Your verification is valid for ${Math.floor(daysUntilExpiry)} more days.`;
        }
      }

      // Format family verification stats
      const verificationRate = Math.round(familyStatus.verificationRate * 100);
      const pendingList = familyStatus.pendingVerifications.length > 0 
        ? familyStatus.pendingVerifications.map(id => id.slice(0, 8) + "...").join(", ")
        : "None";
      const expiringList = familyStatus.expiringSoon.length > 0
        ? familyStatus.expiringSoon.map(id => id.slice(0, 8) + "...").join(", ")
        : "None";

      // Generate identity hash
      const identityHash = userProfile?.verificationData?.hash.slice(0, 16) + "..." || "Not available";

      // Format next actions
      let nextActions = "";
      if (!userProfile?.isVerified) {
        nextActions = `🎯 **Recommended Next Steps:**
1. Complete identity verification to claim UBI
2. Verify family members to unlock group rewards
3. Start earning G$ through positive family interactions`;
      } else if (familyStatus.verificationRate < 1.0) {
        nextActions = `🎯 **Recommended Next Steps:**
1. Help unverified family members complete verification
2. Check for expiring verifications
3. Claim daily UBI and participate in family rewards`;
      } else {
        nextActions = `🎯 **You're all set!**
1. Claim your daily UBI
2. Engage in positive family interactions to earn G$
3. Monitor verification expiry dates`;
      }

      const identityInfo = IDENTITY_TEMPLATE
        .replace(/{{userId}}/g, userId)
        .replace(/{{verificationStatus}}/g, verificationStatus)
        .replace(/{{ubiEligible}}/g, ubiEligible)
        .replace(/{{verificationConfidence}}/g, verificationConfidence)
        .replace(/{{verificationExpiry}}/g, verificationExpiry)
        .replace(/{{familyRelationships}}/g, familyRelationships)
        .replace(/{{uniquenessStatus}}/g, uniquenessStatus)
        .replace(/{{identityConfidence}}/g, identityConfidence.toString())
        .replace(/{{duplicateProfiles}}/g, duplicateProfiles)
        .replace(/{{verificationRequirements}}/g, verificationRequirements)
        .replace(/{{totalFamilyMembers}}/g, familyStatus.totalMembers.toString())
        .replace(/{{verifiedMembers}}/g, familyStatus.verifiedMembers.toString())
        .replace(/{{verificationRate}}/g, verificationRate.toString())
        .replace(/{{pendingVerifications}}/g, pendingList)
        .replace(/{{expiringSoon}}/g, expiringList)
        .replace(/{{identityHash}}/g, identityHash)
        .replace(/{{nextActions}}/g, nextActions);

      return identityInfo;

    } catch (error) {
      elizaLogger.error("Error in identity provider:", error);
      return `Error retrieving identity information: ${error.message}

This might indicate:
- Identity service configuration issues
- Network connectivity problems  
- Database access issues

Please check your GoodDollar plugin configuration and try again.`;
    }
  },
};

export default identityProvider;