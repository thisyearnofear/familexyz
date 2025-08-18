// TypeScript declarations for @elizaos/hedera-wallet package
declare module '@elizaos/hedera-wallet' {
  export interface HederaAccount {
    accountId: string;
    privateKey: string;
    publicKey: string;
  }

  export interface WalletConfig {
    network: 'testnet' | 'mainnet';
    operatorId?: string;
    operatorKey?: string;
  }

  export class HederaWallet {
    constructor(config: WalletConfig);
    createAccount(): Promise<HederaAccount>;
    getBalance(accountId: string): Promise<number>;
    transferHBAR(fromAccount: HederaAccount, toAccountId: string, amount: number): Promise<string>;
  }

  export function createWallet(config: WalletConfig): HederaWallet;
  export function generateAccount(): HederaAccount;
}
