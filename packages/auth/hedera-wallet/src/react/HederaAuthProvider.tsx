import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { HederaAuthService } from "../services/HederaAuthService.js";
import {
  AuthState,
  HederaWalletConnection,
  FamilyAuth,
  AuthSession,
  WalletType,
  JoinFamilyRequest,
  JoinFamilyResponse,
  AuthError,
  HederaAuthConfig,
  SigningRequest,
  SigningResponse,
  AuthEventType,
  AuthEventHandler,
} from "../types/index.js";

// ============================================================================
// ZUSTAND STORE FOR STATE MANAGEMENT
// ============================================================================

interface HederaAuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  connectWallet: (walletType: WalletType) => Promise<HederaWalletConnection>;
  disconnectWallet: () => Promise<void>;
  createFamily: (familyName: string) => Promise<FamilyAuth>;
  joinFamily: (request: JoinFamilyRequest) => Promise<JoinFamilyResponse>;
  signTransaction: (request: SigningRequest) => Promise<SigningResponse>;
  clearError: () => void;

  // Internal state updates
  setInitializing: (isInitializing: boolean) => void;
  setConnecting: (isConnecting: boolean) => void;
  setConnection: (connection: HederaWalletConnection | undefined) => void;
  setFamily: (family: FamilyAuth | undefined) => void;
  setSession: (session: AuthSession | undefined) => void;
  setError: (error: AuthError | undefined) => void;
}

const useHederaAuthStore = create<HederaAuthStore>()(
  immer((set, get) => ({
    // Initial state
    isInitialized: false,
    isConnecting: false,
    isConnected: false,
    currentConnection: undefined,
    currentFamily: undefined,
    availableWallets: [],
    error: undefined,
    session: undefined,

    // Actions
    initialize: async () => {
      const authService = HederaAuthService.getInstance();
      set((state) => {
        state.isInitialized = false;
      });

      try {
        await authService.initialize();
        const authState = authService.getAuthState();

        set((state) => {
          Object.assign(state, authState);
        });
      } catch (error) {
        set((state) => {
          state.error = {
            code: "CONNECTION_FAILED",
            message:
              error instanceof Error ? error.message : "Failed to initialize",
            timestamp: new Date(),
          };
        });
        throw error;
      }
    },

    connectWallet: async (walletType: WalletType) => {
      const authService = HederaAuthService.getInstance();
      set((state) => {
        state.isConnecting = true;
        state.error = undefined;
      });

      try {
        const connection = await authService.connectWallet(walletType);

        set((state) => {
          state.currentConnection = connection;
          state.isConnected = true;
          state.isConnecting = false;
          state.session = authService.getCurrentSession() || undefined;
        });

        return connection;
      } catch (error) {
        set((state) => {
          state.isConnecting = false;
          state.error = {
            code: "CONNECTION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to connect wallet",
            timestamp: new Date(),
          };
        });
        throw error;
      }
    },

    disconnectWallet: async () => {
      const authService = HederaAuthService.getInstance();

      try {
        await authService.disconnectWallet();

        set((state) => {
          state.currentConnection = undefined;
          state.currentFamily = undefined;
          state.session = undefined;
          state.isConnected = false;
          state.error = undefined;
        });
      } catch (error) {
        set((state) => {
          state.error = {
            code: "CONNECTION_FAILED",
            message:
              error instanceof Error
                ? error.message
                : "Failed to disconnect wallet",
            timestamp: new Date(),
          };
        });
        throw error;
      }
    },

    createFamily: async (familyName: string) => {
      const authService = HederaAuthService.getInstance();
      const connection = get().currentConnection;

      if (!connection) {
        throw new Error("No wallet connected");
      }

      try {
        const family = await authService.createFamily(
          familyName,
          connection.accountId,
        );

        set((state) => {
          state.currentFamily = family;
        });

        return family;
      } catch (error) {
        set((state) => {
          state.error = {
            code: "FAMILY_NOT_FOUND",
            message:
              error instanceof Error
                ? error.message
                : "Failed to create family",
            timestamp: new Date(),
          };
        });
        throw error;
      }
    },

    joinFamily: async (request: JoinFamilyRequest) => {
      const authService = HederaAuthService.getInstance();

      try {
        const response = await authService.joinFamily(request);

        if (response.success && response.familyAuth) {
          set((state) => {
            state.currentFamily = response.familyAuth;
          });
        } else {
          set((state) => {
            state.error = {
              code: "INVALID_INVITE_CODE",
              message: response.error || "Failed to join family",
              timestamp: new Date(),
            };
          });
        }

        return response;
      } catch (error) {
        const errorResponse: JoinFamilyResponse = {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to join family",
        };

        set((state) => {
          state.error = {
            code: "FAMILY_NOT_FOUND",
            message: errorResponse.error!,
            timestamp: new Date(),
          };
        });

        return errorResponse;
      }
    },

    signTransaction: async (request: SigningRequest) => {
      const authService = HederaAuthService.getInstance();

      try {
        return await authService.signTransaction(request);
      } catch (error) {
        set((state) => {
          state.error = {
            code: "INVALID_SIGNATURE",
            message:
              error instanceof Error
                ? error.message
                : "Failed to sign transaction",
            timestamp: new Date(),
          };
        });
        throw error;
      }
    },

    clearError: () => {
      set((state) => {
        state.error = undefined;
      });
    },

    // Internal state updates
    setInitializing: (isInitializing: boolean) => {
      set((state) => {
        state.isInitialized = !isInitializing;
      });
    },

    setConnecting: (isConnecting: boolean) => {
      set((state) => {
        state.isConnecting = isConnecting;
      });
    },

    setConnection: (connection: HederaWalletConnection | undefined) => {
      set((state) => {
        state.currentConnection = connection;
        state.isConnected = !!connection;
      });
    },

    setFamily: (family: FamilyAuth | undefined) => {
      set((state) => {
        state.currentFamily = family;
      });
    },

    setSession: (session: AuthSession | undefined) => {
      set((state) => {
        state.session = session;
      });
    },

    setError: (error: AuthError | undefined) => {
      set((state) => {
        state.error = error;
      });
    },
  })),
);

// ============================================================================
// REACT CONTEXT
// ============================================================================

export interface HederaAuthContextValue {
  // State
  isInitialized: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  currentConnection: HederaWalletConnection | undefined;
  currentFamily: FamilyAuth | undefined;
  availableWallets: any[];
  error: AuthError | undefined;
  session: AuthSession | undefined;

  // Actions
  initialize: () => Promise<void>;
  connectWallet: (walletType: WalletType) => Promise<HederaWalletConnection>;
  disconnectWallet: () => Promise<void>;
  createFamily: (familyName: string) => Promise<FamilyAuth>;
  joinFamily: (request: JoinFamilyRequest) => Promise<JoinFamilyResponse>;
  signTransaction: (request: SigningRequest) => Promise<SigningResponse>;
  clearError: () => void;

  // Computed values
  isAuthenticating: boolean;
  hasFamily: boolean;
  canSignTransactions: boolean;

  // Event subscription
  addEventListener: <T extends AuthEventType>(
    event: T,
    handler: AuthEventHandler<T>,
  ) => void;
  removeEventListener: <T extends AuthEventType>(
    event: T,
    handler: AuthEventHandler<T>,
  ) => void;
}

const HederaAuthContext = createContext<HederaAuthContextValue | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export interface HederaAuthProviderProps {
  children: ReactNode;
  config: HederaAuthConfig;
  onError?: (error: AuthError) => void;
  onWalletConnected?: (connection: HederaWalletConnection) => void;
  onFamilyJoined?: (family: FamilyAuth) => void;
}

export const HederaAuthProvider: React.FC<HederaAuthProviderProps> = ({
  children,
  config,
  onError,
  onWalletConnected,
  onFamilyJoined,
}) => {
  const store = useHederaAuthStore();
  const [authService, setAuthService] = useState<HederaAuthService | null>(
    null,
  );

  // Initialize auth service
  useEffect(() => {
    const service = HederaAuthService.getInstance(config);
    setAuthService(service);

    // Setup event listeners
    const handleWalletConnected = (connection: HederaWalletConnection) => {
      store.setConnection(connection);
      onWalletConnected?.(connection);
    };

    const handleWalletDisconnected = () => {
      store.setConnection(undefined);
      store.setFamily(undefined);
      store.setSession(undefined);
    };

    const handleFamilyJoined = (family: FamilyAuth) => {
      store.setFamily(family);
      onFamilyJoined?.(family);
    };

    const handleSessionCreated = (session: AuthSession) => {
      store.setSession(session);
    };

    const handleError = (error: AuthError) => {
      store.setError(error);
      onError?.(error);
    };

    service.on("wallet:connected", handleWalletConnected);
    service.on("wallet:disconnected", handleWalletDisconnected);
    service.on("family:joined", handleFamilyJoined);
    service.on("session:created", handleSessionCreated);
    service.on("wallet:error", handleError);

    return () => {
      service.off("wallet:connected", handleWalletConnected);
      service.off("wallet:disconnected", handleWalletDisconnected);
      service.off("family:joined", handleFamilyJoined);
      service.off("session:created", handleSessionCreated);
      service.off("wallet:error", handleError);
    };
  }, [config, onError, onWalletConnected, onFamilyJoined, store]);

  // Event subscription methods
  const addEventListener = useCallback(
    <T extends AuthEventType>(event: T, handler: AuthEventHandler<T>) => {
      authService?.on(event, handler);
    },
    [authService],
  );

  const removeEventListener = useCallback(
    <T extends AuthEventType>(event: T, handler: AuthEventHandler<T>) => {
      authService?.off(event, handler);
    },
    [authService],
  );

  // Computed values
  const isAuthenticating = store.isConnecting;
  const hasFamily = !!store.currentFamily;
  const canSignTransactions = store.isConnected && !!store.session;

  const contextValue: HederaAuthContextValue = {
    // State
    isInitialized: store.isInitialized,
    isConnecting: store.isConnecting,
    isConnected: store.isConnected,
    currentConnection: store.currentConnection,
    currentFamily: store.currentFamily,
    availableWallets: store.availableWallets,
    error: store.error,
    session: store.session,

    // Actions
    initialize: store.initialize,
    connectWallet: store.connectWallet,
    disconnectWallet: store.disconnectWallet,
    createFamily: store.createFamily,
    joinFamily: store.joinFamily,
    signTransaction: store.signTransaction,
    clearError: store.clearError,

    // Computed values
    isAuthenticating,
    hasFamily,
    canSignTransactions,

    // Event subscription
    addEventListener,
    removeEventListener,
  };

  return (
    <HederaAuthContext.Provider value={contextValue}>
      {children}
    </HederaAuthContext.Provider>
  );
};

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Main hook for accessing Hedera authentication state and actions
 */
export const useHederaAuth = (): HederaAuthContextValue => {
  const context = useContext(HederaAuthContext);
  if (!context) {
    throw new Error("useHederaAuth must be used within a HederaAuthProvider");
  }
  return context;
};

/**
 * Hook for wallet connection status and actions
 */
export const useWalletConnection = () => {
  const {
    isConnected,
    isConnecting,
    currentConnection,
    availableWallets,
    connectWallet,
    disconnectWallet,
    error,
    clearError,
  } = useHederaAuth();

  return {
    isConnected,
    isConnecting,
    connection: currentConnection,
    availableWallets,
    connectWallet,
    disconnectWallet,
    error,
    clearError,
  };
};

/**
 * Hook for family management
 */
export const useFamilyAuth = () => {
  const {
    currentFamily,
    hasFamily,
    createFamily,
    joinFamily,
    error,
    clearError,
  } = useHederaAuth();

  const getCurrentMember = useCallback(() => {
    if (!currentFamily || !useHederaAuth().currentConnection) {
      return null;
    }

    const accountId = useHederaAuth().currentConnection!.accountId;
    return (
      currentFamily.members.find((member) => member.accountId === accountId) ||
      null
    );
  }, [currentFamily]);

  const hasPermission = useCallback(
    (permission: string) => {
      const member = getCurrentMember();
      return member?.permissions.includes(permission) || false;
    },
    [getCurrentMember],
  );

  return {
    family: currentFamily,
    hasFamily,
    currentMember: getCurrentMember(),
    hasPermission,
    createFamily,
    joinFamily,
    error,
    clearError,
  };
};

/**
 * Hook for transaction signing
 */
export const useTransactionSigning = () => {
  const { canSignTransactions, signTransaction, error, clearError } =
    useHederaAuth();

  const [pendingRequests, setPendingRequests] = useState<
    Map<string, SigningRequest>
  >(new Map());

  const submitSigningRequest = useCallback(
    async (request: SigningRequest): Promise<SigningResponse> => {
      setPendingRequests((prev) =>
        new Map(prev).set(request.requestId, request),
      );

      try {
        const response = await signTransaction(request);
        setPendingRequests((prev) => {
          const next = new Map(prev);
          next.delete(request.requestId);
          return next;
        });
        return response;
      } catch (error) {
        setPendingRequests((prev) => {
          const next = new Map(prev);
          next.delete(request.requestId);
          return next;
        });
        throw error;
      }
    },
    [signTransaction],
  );

  return {
    canSign: canSignTransactions,
    pendingRequests: Array.from(pendingRequests.values()),
    submitSigningRequest,
    error,
    clearError,
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { session, isConnected } = useHederaAuth();

  const isSessionValid = useCallback(() => {
    if (!session) return false;
    return new Date() < session.expiresAt;
  }, [session]);

  const getTimeUntilExpiry = useCallback(() => {
    if (!session) return 0;
    return Math.max(0, session.expiresAt.getTime() - Date.now());
  }, [session]);

  return {
    session,
    isActive: isConnected && isSessionValid(),
    timeUntilExpiry: getTimeUntilExpiry(),
    accountId: session?.accountId,
    familyId: session?.familyId,
    permissions: session?.permissions || [],
  };
};

/**
 * Hook for error handling
 */
export const useAuthError = () => {
  const { error, clearError } = useHederaAuth();

  const isError = (code?: string) => {
    return code ? error?.code === code : !!error;
  };

  return {
    error,
    hasError: !!error,
    isError,
    clearError,
  };
};

// ============================================================================
// HIGHER-ORDER COMPONENTS
// ============================================================================

/**
 * HOC that requires wallet connection
 */
export const withWalletConnection = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> => {
  return (props: P) => {
    const { isConnected } = useWalletConnection();

    if (!isConnected) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Wallet Connection Required
            </h3>
            <p className="text-gray-600">
              Please connect your Hedera wallet to continue.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};

/**
 * HOC that requires family membership
 */
export const withFamilyAuth = <P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> => {
  return (props: P) => {
    const { hasFamily } = useFamilyAuth();

    if (!hasFamily) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Family Membership Required
            </h3>
            <p className="text-gray-600">
              Please join or create a family to access this feature.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
