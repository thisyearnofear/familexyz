// ============================================================================
// REACT EXPORTS FOR HEDERA WALLET AUTHENTICATION
// React-specific components, hooks, and utilities
// ============================================================================

export {
  HederaAuthProvider,
  useHederaAuth,
  useWalletConnection,
  useFamilyAuth,
  useTransactionSigning,
  useSession,
  useAuthError,
  withWalletConnection,
  withFamilyAuth,
} from './react/HederaAuthProvider.js';

// React-specific types
export type {
  HederaAuthContextValue,
  HederaAuthProviderProps,
} from './react/HederaAuthProvider.js';

// Re-export core types needed for React usage
export type {
  HederaWalletConnection,
  FamilyAuth,
  AuthSession,
  WalletType,
  AuthError,
  SigningRequest,
  SigningResponse,
  JoinFamilyRequest,
  JoinFamilyResponse,
} from './types/index.js';
