import {
  IAgentRuntime,
  elizaLogger,
  Service,
  ServiceType,
} from "@elizaos/core";
import NodeCache from "node-cache";
import type {
  FaceVerificationResult,
  GDollarIdentityProfile,
  GDollarConfig,
} from "../types.js";
import { validateGDollarConfig } from "../environment.js";
import { ethers } from "ethers";

// FaceTec integration types (based on GoodDollar's FaceTec implementation)
interface FaceTecSessionResult {
  sessionId: string;
  success: boolean;
  faceScanResult?: {
    confidence: number;
    auditTrailImage: string;
    lowQualityAuditTrailImage: string;
  };
  error?: string;
}

interface GoodDollarIdentitySDKConfig {
  faceTecDeviceKeyIdentifier: string;
  faceTecProductionKey: string;
  goodDollarApiEndpoint: string;
  enableFaceVerification: boolean;
}

// Mock FaceTec service (in production, this would integrate with actual FaceTec SDK)
class MockFaceTecService {
  private config: GoodDollarIdentitySDKConfig;

  constructor(config: GoodDollarIdentitySDKConfig) {
    this.config = config;
  }

  async performLivenessCheck(userId: string): Promise<FaceTecSessionResult> {
    // In production, this would integrate with FaceTec ZoOm SDK
    // For now, we'll simulate the verification process
    elizaLogger.info(`🔍 Performing liveness check for user: ${userId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate different outcomes based on user ID pattern
    const shouldSucceed = !userId.includes('fail');
    
    if (shouldSucceed) {
      return {
        sessionId: `session_${Date.now()}_${userId}`,
        success: true,
        faceScanResult: {
          confidence: 0.95 + Math.random() * 0.05, // 95-100% confidence
          auditTrailImage: `data:image/jpeg;base64,${Buffer.from('mock_audit_trail').toString('base64')}`,
          lowQualityAuditTrailImage: `data:image/jpeg;base64,${Buffer.from('mock_low_quality').toString('base64')}`,
        },
      };
    } else {
      return {
        sessionId: `session_${Date.now()}_${userId}`,
        success: false,
        error: "Liveness check failed - please try again in good lighting",
      };
    }
  }

  async verifyIdentity(userId: string, previousSessionId?: string): Promise<{
    isUnique: boolean;
    confidence: number;
    duplicateFound?: string;
  }> {
    elizaLogger.info(`🔍 Verifying identity uniqueness for user: ${userId}`);
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate sybil resistance check
    const isDuplicate = userId.includes('duplicate');
    
    if (isDuplicate) {
      return {
        isUnique: false,
        confidence: 0.92,
        duplicateFound: `user_${Math.random().toString(36).substr(2, 9)}`,
      };
    }
    
    return {
      isUnique: true,
      confidence: 0.97,
    };
  }
}

export class IdentityService extends Service {
  static serviceType: ServiceType = ServiceType.IDENTITY;
  
  private config: GDollarConfig;
  private identityConfig: GoodDollarIdentitySDKConfig;
  private faceTecService: MockFaceTecService;
  private cache: NodeCache;
  private identityProfiles: Map<string, GDollarIdentityProfile>;

  constructor() {
    super();
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.identityProfiles = new Map();
  }

  async initialize(runtime: IAgentRuntime): Promise<void> {
    try {
      this.config = validateGDollarConfig(runtime);
      
      this.identityConfig = {
        faceTecDeviceKeyIdentifier: runtime.getSetting("GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER") || "default_device_key",
        faceTecProductionKey: runtime.getSetting("GOODDOLLAR_FACETEC_PRODUCTION_KEY") || "default_production_key",
        goodDollarApiEndpoint: runtime.getSetting("GOODDOLLAR_API_ENDPOINT") || "https://api.gooddollar.org",
        enableFaceVerification: this.config.enableFaceVerification,
      };

      if (this.config.enableFaceVerification) {
        this.faceTecService = new MockFaceTecService(this.identityConfig);
        elizaLogger.info("🔐 Face verification service initialized");
      }

      elizaLogger.success("✅ GoodDollar Identity service initialized");
    } catch (error) {
      elizaLogger.error("❌ Failed to initialize Identity service:", error);
      throw error;
    }
  }

  async verifyFamilyMember(
    userId: string,
    walletAddress: string,
    familyId: string,
    role: "parent" | "child" | "grandparent" | "sibling" | "other" = "other"
  ): Promise<FaceVerificationResult> {
    try {
      elizaLogger.info(`🔍 Starting family member verification for ${userId}`);

      if (!this.config.enableFaceVerification) {
        // Return mock success when face verification is disabled
        const mockResult: FaceVerificationResult = {
          success: true,
          confidence: 1.0,
          sessionId: `mock_session_${Date.now()}`,
          userId,
          timestamp: Date.now(),
        };
        
        await this.createOrUpdateIdentityProfile(userId, walletAddress, familyId, role, true);
        return mockResult;
      }

      // Step 1: Perform liveness check
      const livenessResult = await this.faceTecService.performLivenessCheck(userId);
      
      if (!livenessResult.success) {
        return {
          success: false,
          confidence: 0,
          sessionId: livenessResult.sessionId,
          error: livenessResult.error,
          userId,
          timestamp: Date.now(),
        };
      }

      // Step 2: Verify identity uniqueness (sybil resistance)
      const uniquenessCheck = await this.faceTecService.verifyIdentity(userId, livenessResult.sessionId);
      
      if (!uniquenessCheck.isUnique) {
        return {
          success: false,
          confidence: uniquenessCheck.confidence,
          sessionId: livenessResult.sessionId,
          error: `Duplicate identity detected. This face has already been registered.`,
          userId,
          timestamp: Date.now(),
        };
      }

      // Step 3: Create identity profile
      await this.createOrUpdateIdentityProfile(userId, walletAddress, familyId, role, true);

      const result: FaceVerificationResult = {
        success: true,
        confidence: Math.min(livenessResult.faceScanResult!.confidence, uniquenessCheck.confidence),
        sessionId: livenessResult.sessionId,
        userId,
        timestamp: Date.now(),
      };

      elizaLogger.success(`✅ Family member verification successful: ${userId}`);
      return result;

    } catch (error) {
      elizaLogger.error("❌ Face verification failed:", error);
      return {
        success: false,
        confidence: 0,
        sessionId: `error_session_${Date.now()}`,
        error: error.message,
        userId,
        timestamp: Date.now(),
      };
    }
  }

  async createOrUpdateIdentityProfile(
    userId: string,
    walletAddress: string,
    familyId: string,
    role: "parent" | "child" | "grandparent" | "sibling" | "other",
    isVerified: boolean
  ): Promise<GDollarIdentityProfile> {
    const existingProfile = this.identityProfiles.get(userId);
    
    const profile: GDollarIdentityProfile = {
      userId,
      walletAddress,
      isVerified,
      familyRelationships: existingProfile?.familyRelationships || [],
      ubiEligible: isVerified,
      lastActivity: Date.now(),
    };

    // Add or update family relationship
    const existingRelationshipIndex = profile.familyRelationships.findIndex(
      rel => rel.familyId === familyId
    );

    const familyRelationship = {
      familyId,
      role,
      verifiedBy: isVerified ? userId : undefined,
    };

    if (existingRelationshipIndex >= 0) {
      profile.familyRelationships[existingRelationshipIndex] = familyRelationship;
    } else {
      profile.familyRelationships.push(familyRelationship);
    }

    // Add verification data if verified
    if (isVerified) {
      const verificationHash = ethers.keccak256(
        ethers.toUtf8Bytes(`${userId}_${walletAddress}_${Date.now()}`)
      );
      
      profile.verificationData = {
        hash: verificationHash,
        expiryTime: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days
      };
    }

    this.identityProfiles.set(userId, profile);
    
    // Cache the profile
    this.cache.set(`profile_${userId}`, profile);
    
    elizaLogger.info(`👤 Identity profile updated for ${userId} in family ${familyId}`);
    return profile;
  }

  async getIdentityProfile(userId: string): Promise<GDollarIdentityProfile | null> {
    // Try cache first
    const cached = this.cache.get<GDollarIdentityProfile>(`profile_${userId}`);
    if (cached) {
      return cached;
    }

    // Try in-memory storage
    const profile = this.identityProfiles.get(userId);
    if (profile) {
      this.cache.set(`profile_${userId}`, profile);
      return profile;
    }

    return null;
  }

  async getFamilyMembers(familyId: string): Promise<GDollarIdentityProfile[]> {
    const familyMembers: GDollarIdentityProfile[] = [];
    
    for (const [userId, profile] of this.identityProfiles) {
      const hasFamily = profile.familyRelationships.some(
        rel => rel.familyId === familyId
      );
      
      if (hasFamily) {
        familyMembers.push(profile);
      }
    }
    
    return familyMembers;
  }

  async isUBIEligible(userId: string): Promise<boolean> {
    const profile = await this.getIdentityProfile(userId);
    
    if (!profile) {
      return false;
    }

    // Check if verified
    if (!profile.isVerified) {
      return false;
    }

    // Check if verification hasn't expired
    if (profile.verificationData) {
      const isExpired = Date.now() > profile.verificationData.expiryTime;
      if (isExpired) {
        elizaLogger.warn(`⚠️ Verification expired for user ${userId}`);
        return false;
      }
    }

    return profile.ubiEligible;
  }

  async checkSybilResistance(userId: string): Promise<{
    isUnique: boolean;
    confidence: number;
    similarProfiles: string[];
  }> {
    if (!this.config.enableFaceVerification) {
      return {
        isUnique: true,
        confidence: 1.0,
        similarProfiles: [],
      };
    }

    try {
      const result = await this.faceTecService.verifyIdentity(userId);
      
      return {
        isUnique: result.isUnique,
        confidence: result.confidence,
        similarProfiles: result.duplicateFound ? [result.duplicateFound] : [],
      };
    } catch (error) {
      elizaLogger.error("❌ Sybil resistance check failed:", error);
      return {
        isUnique: false,
        confidence: 0,
        similarProfiles: [],
      };
    }
  }

  async renewVerification(userId: string): Promise<FaceVerificationResult> {
    elizaLogger.info(`🔄 Renewing verification for user ${userId}`);
    
    const profile = await this.getIdentityProfile(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    // Use the primary family relationship for renewal
    const primaryFamily = profile.familyRelationships[0];
    if (!primaryFamily) {
      throw new Error("No family relationships found for user");
    }

    return this.verifyFamilyMember(
      userId,
      profile.walletAddress,
      primaryFamily.familyId,
      primaryFamily.role
    );
  }

  async getFamilyVerificationStatus(familyId: string): Promise<{
    totalMembers: number;
    verifiedMembers: number;
    verificationRate: number;
    pendingVerifications: string[];
    expiringSoon: string[];
  }> {
    const familyMembers = await this.getFamilyMembers(familyId);
    
    const verifiedMembers = familyMembers.filter(member => member.isVerified);
    const pendingVerifications = familyMembers
      .filter(member => !member.isVerified)
      .map(member => member.userId);
      
    const expiringSoon = familyMembers
      .filter(member => {
        if (!member.verificationData) return false;
        const daysUntilExpiry = (member.verificationData.expiryTime - Date.now()) / (1000 * 60 * 60 * 24);
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0; // Expiring within 7 days
      })
      .map(member => member.userId);

    return {
      totalMembers: familyMembers.length,
      verifiedMembers: verifiedMembers.length,
      verificationRate: familyMembers.length > 0 ? verifiedMembers.length / familyMembers.length : 0,
      pendingVerifications,
      expiringSoon,
    };
  }

  getConfig(): GDollarConfig {
    return this.config;
  }
}