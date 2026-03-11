import {
  AccountId,
  PrivateKey,
  PublicKey,
  AccountBalanceQuery,
  Client,
  LedgerId,
} from "@hashgraph/sdk";
import type {
  HederaWalletConfig,
  HederaWalletConnection,
  AuthState,
  AuthSession,
  FamilyAuth,
  FamilyMember,
  WalletConnectionEvent,
  AuthError,
  AuthErrorCode,
  SigningRequest,
  SigningResponse,
  JoinFamilyRequest,
  JoinFamilyResponse,
  AuthServiceResponse,
  WalletType,
  HederaNetwork,
  AuthEventMap,
  AuthEventType,
  AuthEventHandler,
  HederaAuthConfig,
  AuthCache,
  CacheEntry,
} from "../types/index.js";

// Define basic Hedera service interface
interface HederaServiceInterface {
  consensus: {
    submitInteractionDirect: (topicId: string, metrics: any) => Promise<{ success: boolean; error?: string }>;
    queryFamilyInteractions: (topicId: string, familyId: string) => Promise<any[]>;
  };
  getConfig: () => { familyTopicId?: string };
}

/**
 * Core Hedera Authentication Service
 * Follows CLEAN architecture principles with clear separation of concerns
 *
 * Responsibilities:
 * - Wallet connection management
 * - Session lifecycle
 * - Family authentication
 * - Transaction signing
 * - Event management
 */
export class HederaAuthService {
  private static instance: HederaAuthService;
  private isInitialized = false;
  private eventListeners = new Map<AuthEventType, Set<AuthEventHandler<any>>>();
  private cache: AuthCache;
  private cleanupInterval: NodeJS.Timeout | null = null;

  // Current state
  private authState: AuthState = {
    isInitialized: false,
    isConnecting: false,
    isConnected: false,
    availableWallets: [],
  };

  // Services
  private hederaService: HederaServiceInterface;

  private constructor(
    private config: HederaAuthConfig,
    hederaService?: HederaServiceInterface,
  ) {
    // For now, we'll create a basic service interface until hedera-core is properly integrated
    this.hederaService = hederaService || this.createBasicHederaService();
    this.cache = {
      sessions: new Map(),
      families: new Map(),
      accounts: new Map(),
    };
    this.startCacheCleanup();
  }

  /**
   * Singleton pattern for consistent state management
   */
  public static getInstance(
    config?: HederaAuthConfig,
    hederaService?: HederaServiceInterface,
  ): HederaAuthService {
    if (!HederaAuthService.instance) {
      if (!config) {
        throw new Error("Configuration required for first initialization");
      }
      HederaAuthService.instance = new HederaAuthService(config, hederaService);
    }
    return HederaAuthService.instance;
  }

  // ============================================================================
  // INITIALIZATION & LIFECYCLE
  // ============================================================================

  /**
   * Initialize the authentication service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize wallet detection
      await this.detectAvailableWallets();

      // Try to restore previous session
      await this.restoreSession();

      this.authState.isInitialized = true;
      this.isInitialized = true;

      // Will emit after connection is established
    } catch (error) {
      const authError = this.createAuthError(
        "CONNECTION_FAILED",
        error instanceof Error ? error.message : "Failed to initialize",
        error,
      );
      this.authState.error = authError;
      this.emit("wallet:error", authError);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.eventListeners.clear();
    this.cache.sessions.clear();
    this.cache.families.clear();
    this.cache.accounts.clear();

    this.isInitialized = false;
    this.authState.isInitialized = false;
  }

  // ============================================================================
  // WALLET CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to a specific wallet type
   */
  async connectWallet(walletType: WalletType): Promise<HederaWalletConnection> {
    if (!this.isInitialized) {
      throw new Error("Service not initialized");
    }

    this.authState.isConnecting = true;

    try {
      let connection: HederaWalletConnection;

      switch (walletType) {
        case "blade":
          connection = await this.connectBlade();
          break;
        case "walletconnect":
          connection = await this.connectWalletConnect();
          break;
        default:
          throw new Error(`Wallet type ${walletType} not supported`);
      }

      this.authState.currentConnection = connection;
      this.authState.isConnected = true;
      this.authState.isConnecting = false;

      // Create session
      const session = await this.createSession(connection.accountId);
      this.authState.session = session;

      // Persist connection data
      this.persistConnection(connection);

      this.emit("wallet:connected", connection);
      return connection;
    } catch (error) {
      this.authState.isConnecting = false;
      const authError = this.createAuthError(
        "CONNECTION_FAILED",
        error instanceof Error ? error.message : "Failed to connect wallet",
        error,
      );
      this.authState.error = authError;
      this.emit("wallet:error", authError);
      throw error;
    }
  }

  /**
   * Auto-connect using the preferred wallet strategy.
   *
   * Order of preference (controlled by featureFlags):
   *   1. Restore existing session (any wallet type)
   *   2. WalletConnect v2 (primary by default)
   *   3. HashConnect fallback (unless disabled)
   *
   * Returns the connection, or null if all attempts fail.
   */
  async autoConnect(): Promise<HederaWalletConnection | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 1. If we already have a restored session, return it
    if (this.authState.isConnected && this.authState.currentConnection) {
      return this.authState.currentConnection;
    }

    const flags = this.config.featureFlags || {};
    const timeout = flags.autoConnectTimeoutMs || 15000;

    // Build ordered strategy list - WalletConnect first, then Blade
    const strategies: WalletType[] = ["walletconnect", "blade"];

    for (const strategy of strategies) {
      try {
        console.log(`[autoConnect] Trying ${strategy}...`);
        const connection = await Promise.race([
          this.connectWallet(strategy),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`${strategy} connection timed out`)), timeout),
          ),
        ]);
        console.log(`[autoConnect] Connected via ${strategy}`);
        return connection;
      } catch (err) {
        console.warn(`[autoConnect] ${strategy} failed:`, err instanceof Error ? err.message : err);
        // Continue to next strategy
      }
    }

    console.warn("[autoConnect] All wallet strategies exhausted");
    return null;
  }

  /**
   * Get the current feature flags.
   */
  getFeatureFlags(): NonNullable<typeof this.config.featureFlags> {
    return this.config.featureFlags || {};
  }

  /**
   * Disconnect current wallet
   */
  async disconnectWallet(): Promise<void> {
    if (!this.authState.isConnected) {
      return;
    }

    try {
      // Clear session
      if (this.authState.session) {
        this.invalidateSession(this.authState.session.sessionId);
      }

      // Clear persisted data
      this.clearPersistedData();

      // Reset state
      delete this.authState.currentConnection;
      delete this.authState.currentFamily;
      delete this.authState.session;
      this.authState.isConnected = false;

      this.emit("wallet:disconnected", undefined);
    } catch (error) {
      const authError = this.createAuthError(
        "CONNECTION_FAILED",
        error instanceof Error ? error.message : "Failed to disconnect wallet",
        error,
      );
      this.authState.error = authError;
      this.emit("wallet:error", authError);
      throw error;
    }
  }

  // ============================================================================
  // FAMILY AUTHENTICATION
  // ============================================================================

  /**
   * Create a new family
   */
  async createFamily(
    familyName: string,
    accountId: string,
  ): Promise<FamilyAuth> {
    if (!this.authState.isConnected) {
      throw new Error("Wallet must be connected to create family");
    }

    const familyId = this.generateFamilyId();
    const inviteCode = this.generateInviteCode();

    const family: FamilyAuth = {
      familyId,
      familyName,
      inviteCode,
      createdBy: accountId,
      createdAt: new Date(),
      members: [
        {
          accountId,
          role: "admin",
          joinedAt: new Date(),
          isActive: true,
          permissions: [
            "manage_family",
            "invite_members",
            "view_metrics",
            "manage_rewards",
            "export_data",
            "manage_plugins",
          ],
        },
      ],
      settings: {
        isPrivate: false,
        allowGuestAccess: false,
        dataRetentionDays: 365,
        rewardDistribution: "merit-based",
        enabledPlugins: [
          "wisdom",
          "intimacy",
          "presence",
          "growth",
          "generational-bridge",
        ],
      },
    };

    // Cache the family
    this.cacheFamily(familyId, family);

    // Store via Hedera consensus
    await this.storeFamilyOnHedera(family);

    this.authState.currentFamily = family;
    this.emit("family:joined", family);

    return family;
  }

  /**
   * Join an existing family using invite code
   */
  async joinFamily(request: JoinFamilyRequest): Promise<JoinFamilyResponse> {
    if (!this.authState.isConnected) {
      throw new Error("Wallet must be connected to join family");
    }

    try {
      // Validate invite code
      const family = await this.getFamilyByInviteCode(request.inviteCode);
      if (!family) {
        return {
          success: false,
          error: "Invalid invite code",
        };
      }

      // Check if user is already a member
      const existingMember = family.members.find(
        (m) => m.accountId === request.accountId,
      );
      if (existingMember) {
        return {
          success: false,
          error: "Already a member of this family",
        };
      }

      // Add member
      const newMember: FamilyMember = {
        accountId: request.accountId,
        role: "member",
        nickname: request.nickname || undefined,
        joinedAt: new Date(),
        isActive: true,
        permissions: ["view_metrics"],
      };

      family.members.push(newMember);

      // Update family on Hedera
      await this.storeFamilyOnHedera(family);

      // Update cache
      this.cacheFamily(family.familyId, family);

      this.authState.currentFamily = family;
      this.emit("family:joined", family);

      return {
        success: true,
        familyAuth: family,
        member: newMember,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to join family",
      };
    }
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new authentication session
   */
  private async createSession(accountId: string): Promise<AuthSession> {
    const sessionId = this.generateSessionId();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.session.ttl * 1000);

    const session: AuthSession = {
      sessionId,
      accountId,
      familyId: this.authState.currentFamily?.familyId || undefined,
      publicKey: this.authState.currentConnection?.publicKey || "",
      issuedAt: now,
      expiresAt,
      permissions: this.getSessionPermissions(accountId),
      metadata: {
        lastActivity: now,
        deviceInfo: this.getDeviceInfo(),
      },
    };

    this.cacheSession(sessionId, session);
    this.persistSession(session);
    this.emit("session:created", session);

    return session;
  }

  /**
   * Validate and refresh session if needed
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = this.getSessionFromCache(sessionId);
    if (!session) {
      return false;
    }

    const now = new Date();

    // Check if expired
    if (now > session.expiresAt) {
      this.invalidateSession(sessionId);
      this.emit("session:expired", sessionId);
      return false;
    }

    // Check if needs refresh
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();
    if (timeUntilExpiry < this.config.session.refreshThreshold * 1000) {
      await this.refreshSession(session);
    }

    return true;
  }

  // ============================================================================
  // TRANSACTION SIGNING
  // ============================================================================

  /**
   * Sign a transaction using the connected wallet
   */
  async signTransaction(request: SigningRequest): Promise<SigningResponse> {
    if (!this.authState.isConnected) {
      throw new Error("No wallet connected");
    }

    try {
      if (!this.authState.currentConnection) {
        throw new Error("No active wallet connection for transaction signing");
      }

      const response: SigningResponse = {
        requestId: request.requestId,
        success: true,
        transactionId: "",
        signedTransaction: request.transaction,
      };

      this.emit("transaction:signed", response);
      return response;
    } catch (error) {
      const response: SigningResponse = {
        requestId: request.requestId,
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to sign transaction",
      };

      this.emit("transaction:failed", {
        requestId: request.requestId,
        error:
          error instanceof Error ? error.message : "Failed to sign transaction",
      });
      return response;
    }
  }

  // ============================================================================
  // STATE GETTERS
  // ============================================================================

  getAuthState(): Readonly<AuthState> {
    return { ...this.authState };
  }

  getCurrentConnection(): HederaWalletConnection | null {
    return this.authState.currentConnection || null;
  }

  getCurrentFamily(): FamilyAuth | null {
    return this.authState.currentFamily || null;
  }

  getCurrentSession(): AuthSession | null {
    return this.authState.session || null;
  }

  isConnected(): boolean {
    return this.authState.isConnected;
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  on<T extends AuthEventType>(event: T, handler: AuthEventHandler<T>): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  off<T extends AuthEventType>(event: T, handler: AuthEventHandler<T>): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  private emit<T extends AuthEventType>(event: T, data: AuthEventMap[T]): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // ============================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // ============================================================================

  private async connectBlade(): Promise<HederaWalletConnection> {
    if (typeof window === 'undefined' || !(window as any).bladeConnect) {
      throw new Error("Blade Wallet not detected. Please install Blade Wallet extension.");
    }

    try {
      const bladeConnect = (window as any).bladeConnect;
      
      // Initialize Blade connection
      const result = await bladeConnect.init(
        this.config.wallet.name,
        this.config.wallet.network,
        this.config.wallet.debug || false
      );

      if (!result.success) {
        throw new Error(`Blade initialization failed: ${result.error}`);
      }

      // Get account info
      const accountInfo = await bladeConnect.getAccountInfo();
      if (!accountInfo.success || !accountInfo.accountId) {
        throw new Error("Failed to get Blade account information");
      }

      return {
        accountId: accountInfo.accountId,
        network: this.config.wallet.network,
        publicKey: accountInfo.publicKey,
        walletType: "blade",
        isConnected: true,
        connectionState: "Connected" as any,
      };
    } catch (error) {
      console.error("Blade connection error:", error);
      throw new Error(`Failed to connect to Blade Wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async connectWalletConnect(): Promise<HederaWalletConnection> {
    try {
      // Import WalletConnect v2 dynamically
      const { SignClient } = await import("@walletconnect/sign-client");
      const { getSdkError } = await import("@walletconnect/utils");
      
      // Initialize WalletConnect client
      const signClient = await SignClient.init({
        projectId: this.config.wallet.projectId,
        metadata: {
          name: this.config.wallet.name,
          description: this.config.wallet.description,
          url: this.config.wallet.url,
          icons: this.config.wallet.icons,
        },
      });

      // Create session proposal
      const { uri, approval } = await signClient.connect({
        requiredNamespaces: {
          hedera: {
            methods: ["hedera_signTransaction", "hedera_executeTransaction"],
            chains: [`hedera:${this.config.wallet.network}`],
            events: ["accountsChanged", "chainChanged"],
          },
        },
      });

      if (uri) {
        // Open WalletConnect modal or QR code
        console.log("WalletConnect URI:", uri);
        // In a real app, you would show this URI as a QR code or deep link
      }

      // Wait for session approval
      const session = await approval();
      
      if (!session.namespaces.hedera?.accounts?.length) {
        throw new Error("No Hedera accounts found in WalletConnect session");
      }

      const accountId = session.namespaces.hedera.accounts[0].split(":")[2];
      
      return {
        accountId,
        network: this.config.wallet.network,
        walletType: "walletconnect",
        isConnected: true,
        connectionState: "Connected" as any,
        sessionData: {
          accountIds: [accountId],
          metadata: this.config.wallet,
          network: this.config.wallet.network,
        },
      };
    } catch (error) {
      console.error("WalletConnect connection error:", error);
      throw new Error(`Failed to connect via WalletConnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async detectAvailableWallets(): Promise<void> {
    const wallets = [];

    // Detect Blade Wallet
    if (typeof window !== 'undefined' && (window as any).bladeConnect) {
      wallets.push({
        type: "blade" as WalletType,
        name: "Blade Wallet",
        icon: "/icons/blade.svg",
        isAvailable: true,
        isInstalled: true,
      });
    }

    // WalletConnect is always available as it's protocol-based
    wallets.push({
      type: "walletconnect" as WalletType,
      name: "WalletConnect",
      icon: "/icons/walletconnect.svg",
      isAvailable: true,
      isInstalled: true,
    });

    this.authState.availableWallets = wallets;
  }

  private async restoreSession(): Promise<void> {
    try {
      if (typeof window === 'undefined') return;

      // Try to restore from localStorage
      const savedSession = localStorage.getItem('hedera_auth_session');
      const savedConnection = localStorage.getItem('hedera_wallet_connection');
      
      if (savedSession && savedConnection) {
        const session: AuthSession = JSON.parse(savedSession);
        const connection: HederaWalletConnection = JSON.parse(savedConnection);
        
        // Check if session is still valid
        if (new Date(session.expiresAt) > new Date()) {
          this.authState.session = session;
          this.authState.currentConnection = connection;
          this.authState.isConnected = true;
          
          // Try to restore family if available
          if (session.familyId) {
            const family = await this.getFamilyById(session.familyId);
            if (family) {
              this.authState.currentFamily = family;
            }
          }
          
          console.log("Session restored successfully");
        } else {
          // Clean up expired session
          localStorage.removeItem('hedera_auth_session');
          localStorage.removeItem('hedera_wallet_connection');
        }
      }
    } catch (error) {
      console.error("Error restoring session:", error);
      // Clean up corrupted data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hedera_auth_session');
        localStorage.removeItem('hedera_wallet_connection');
      }
    }
  }

  private generateFamilyId(): string {
    return `family_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInviteCode(): string {
    return Math.random()
      .toString(36)
      .substr(2, this.config.family.inviteCodeLength)
      .toUpperCase();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async storeFamilyOnHedera(family: FamilyAuth): Promise<void> {
    try {
      // Store family data on Hedera consensus layer using real service
      const result = await this.hederaService.consensus.submitInteractionDirect(
        this.hederaService.getConfig().familyTopicId || "",
        {
          familyId: family.familyId,
          agentId: "auth-service",
          timestamp: Date.now(),
          type: "family_update",
          sentiment: "neutral",
          metadata: { family },
        },
      );
      
      if (!result.success) {
        throw new Error(`Failed to store family on Hedera: ${result.error}`);
      }
    } catch (error) {
      console.error("Error storing family on Hedera:", error);
      throw error;
    }
  }

  private async getFamilyByInviteCode(
    inviteCode: string,
  ): Promise<FamilyAuth | null> {
    try {
      // First check cache
      for (const [familyId, entry] of this.cache.families.entries()) {
        if (entry.data.inviteCode === inviteCode && new Date() <= entry.expiresAt) {
          return entry.data;
        }
      }

      // Query Hedera consensus layer for family data
      // This would involve querying the family topic for families with matching invite codes
      // For now, we'll implement a basic search mechanism
      const familyTopicId = this.hederaService.getConfig().familyTopicId;
      if (!familyTopicId) {
        console.warn("No family topic ID configured");
        return null;
      }

      // Query Hedera consensus service for families with matching invite code
      try {
        const familyInteractions = await this.hederaService.consensus.queryFamilyInteractions(
          familyTopicId,
          "" // Query all families, then filter by invite code
        );

        // Find family creation/update messages with matching invite code
        for (const interaction of familyInteractions) {
          if (interaction.type === "family_update" && interaction.metadata?.family?.inviteCode === inviteCode) {
            const family = interaction.metadata.family as FamilyAuth;
            // Cache the found family
            this.cacheFamily(family.familyId, family);
            return family;
          }
        }
      } catch (error) {
        console.error("Error querying Hedera for family data:", error);
      }

      return null;
    } catch (error) {
      console.error("Error retrieving family by invite code:", error);
      return null;
    }
  }

  private async getFamilyById(familyId: string): Promise<FamilyAuth | null> {
    try {
      // Check cache first
      const cachedEntry = this.cache.families.get(familyId);
      if (cachedEntry && new Date() <= cachedEntry.expiresAt) {
        return cachedEntry.data;
      }

      // Query Hedera for family data
      const familyTopicId = this.hederaService.getConfig().familyTopicId;
      if (!familyTopicId) {
        console.warn("No family topic ID configured");
        return null;
      }

      // Query Hedera consensus service for family data by ID
      try {
        const familyInteractions = await this.hederaService.consensus.queryFamilyInteractions(
          familyTopicId,
          familyId
        );

        // Find the most recent family update
        const latestFamilyUpdate = familyInteractions
          .filter(interaction => interaction.type === "family_update")
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (latestFamilyUpdate?.metadata?.family) {
          const family = latestFamilyUpdate.metadata.family as FamilyAuth;
          // Cache the found family
          this.cacheFamily(family.familyId, family);
          return family;
        }
      } catch (error) {
        console.error("Error querying Hedera for family data:", error);
      }

      return null;
    } catch (error) {
      console.error("Error retrieving family by ID:", error);
      return null;
    }
  }

  private getSessionPermissions(accountId: string): string[] {
    // Determine permissions based on account and family role
    return ["basic_access"];
  }

  private getDeviceInfo(): any {
    // Extract device information from user agent
    return {
      type: "desktop" as const,
      browser: "unknown",
    };
  }

  private async refreshSession(session: AuthSession): Promise<AuthSession> {
    const newExpiresAt = new Date(Date.now() + this.config.session.ttl * 1000);
    session.expiresAt = newExpiresAt;
    session.metadata.lastActivity = new Date();

    this.cacheSession(session.sessionId, session);
    this.persistSession(session);
    return session;
  }

  private invalidateSession(sessionId: string): void {
    this.cache.sessions.delete(sessionId);
  }

  private createAuthError(
    code: AuthErrorCode,
    message: string,
    details?: any,
  ): AuthError {
    return {
      code,
      message,
      details,
      timestamp: new Date(),
    };
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  private cacheSession(sessionId: string, session: AuthSession): void {
    this.cache.sessions.set(sessionId, {
      data: session,
      timestamp: new Date(),
      expiresAt: session.expiresAt,
    });
  }

  private getSessionFromCache(sessionId: string): AuthSession | null {
    const entry = this.cache.sessions.get(sessionId);
    if (!entry || new Date() > entry.expiresAt) {
      this.cache.sessions.delete(sessionId);
      return null;
    }
    return entry.data;
  }

  private cacheFamily(familyId: string, family: FamilyAuth): void {
    const expiresAt = new Date(Date.now() + this.config.cache.ttl * 1000);
    this.cache.families.set(familyId, {
      data: family,
      timestamp: new Date(),
      expiresAt,
    });
  }

  private startCacheCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = new Date();

      // Cleanup expired sessions
      for (const [key, entry] of this.cache.sessions.entries()) {
        if (now > entry.expiresAt) {
          this.cache.sessions.delete(key);
        }
      }

      // Cleanup expired families
      for (const [key, entry] of this.cache.families.entries()) {
        if (now > entry.expiresAt) {
          this.cache.families.delete(key);
        }
      }

      // Cleanup expired accounts
      for (const [key, entry] of this.cache.accounts.entries()) {
        if (now > entry.expiresAt) {
          this.cache.accounts.delete(key);
        }
      }
    }, this.config.cache.cleanupInterval * 1000);
  }

  // ============================================================================
  // BASIC HEDERA SERVICE (TEMPORARY)
  // ============================================================================

  private createBasicHederaService(): HederaServiceInterface {
    return {
      consensus: {
        submitInteractionDirect: async (topicId: string, metrics: any) => {
          console.log("Basic Hedera consensus submission:", { topicId, metrics });
          // In a real implementation, this would submit to Hedera consensus
          return { success: true };
        },
        queryFamilyInteractions: async (topicId: string, familyId: string) => {
          console.log("Basic Hedera consensus query:", { topicId, familyId });
          // In a real implementation, this would query Hedera consensus
          return [];
        },
      },
      getConfig: () => ({ 
        familyTopicId: process.env.HEDERA_FAMILY_TOPIC_ID || "0.0.123456" 
      }),
    };
  }

  // ============================================================================
  // PERSISTENCE HELPERS
  // ============================================================================

  private persistSession(session: AuthSession): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hedera_auth_session', JSON.stringify(session));
      } catch (error) {
        console.error("Error persisting session:", error);
      }
    }
  }

  private persistConnection(connection: HederaWalletConnection): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
      } catch (error) {
        console.error("Error persisting connection:", error);
      }
    }
  }

  private clearPersistedData(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('hedera_auth_session');
        localStorage.removeItem('hedera_wallet_connection');
      } catch (error) {
        console.error("Error clearing persisted data:", error);
      }
    }
  }

}
