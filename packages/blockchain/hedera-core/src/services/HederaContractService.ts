import {
  ContractCallQuery,
  ContractExecuteTransaction,
  ContractCreateTransaction,
  ContractId,
  ContractFunctionParameters,
  Hbar,
} from "@hashgraph/sdk";
import {
  HederaServiceResponse,
  SmartContractCall,
  ContractFunction,
  FamilyGovernanceState,
  FamilyMember,
} from "../types/index.js";
import type { HederaService } from "./HederaService.js";

export class HederaContractService {
  constructor(private hederaService: HederaService) {}

  /**
   * Deploy family governance smart contract
   */
  async deployFamilyGovernanceContract(
    bytecode: Uint8Array,
    initialGas: number = 100000,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractCreateTransaction()
        .setBytecode(bytecode)
        .setGas(initialGas)
        .setConstructorParameters(
          new ContractFunctionParameters()
            .addUint256(80) // Health threshold (80%)
            .addUint256(604800), // Voting period (1 week in seconds)
        );

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      if (!receipt.contractId) {
        throw new Error("Failed to deploy contract - no contract ID returned");
      }

      const contractId = receipt.contractId.toString();
      console.log(`✅ Deployed family governance contract: ${contractId}`);

      return contractId;
    }, "deployFamilyGovernanceContract");
  }

  /**
   * Add family member to governance contract
   */
  async addFamilyMember(
    contractId: string,
    familyId: string,
    memberAccountId: string,
    role: string,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "addFamilyMember",
          new ContractFunctionParameters()
            .addString(familyId)
            .addAddress(memberAccountId)
            .addString(role),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Added family member ${memberAccountId} to contract: ${transactionId}`,
      );

      return transactionId;
    }, "addFamilyMember");
  }

  /**
   * Update family member health score
   */
  async updateHealthScore(
    contractId: string,
    familyId: string,
    memberAccountId: string,
    healthScore: number,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "updateHealthScore",
          new ContractFunctionParameters()
            .addString(familyId)
            .addAddress(memberAccountId)
            .addUint256(healthScore),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Updated health score for ${memberAccountId}: ${healthScore} (${transactionId})`,
      );

      return transactionId;
    }, "updateHealthScore");
  }

  /**
   * Query family governance state
   */
  async getFamilyGovernanceState(
    contractId: string,
    familyId: string,
  ): Promise<HederaServiceResponse<FamilyGovernanceState>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction(
          "getFamilyState",
          new ContractFunctionParameters().addString(familyId),
        );

      const result = await query.execute(client);

      // Parse the result (this would depend on your specific contract ABI)
      // For now, returning a placeholder structure
      const governanceState: FamilyGovernanceState = {
        familyId,
        members: [], // Would parse from contract result
        healthThreshold: 80,
        votingPeriod: 604800,
        proposalCount: 0,
        isActive: true,
      };

      return governanceState;
    }, "getFamilyGovernanceState");
  }

  /**
   * Create family proposal
   */
  async createProposal(
    contractId: string,
    familyId: string,
    proposalDescription: string,
    votingPeriod: number = 604800,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(150000)
        .setFunction(
          "createProposal",
          new ContractFunctionParameters()
            .addString(familyId)
            .addString(proposalDescription)
            .addUint256(votingPeriod),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Created family proposal: ${proposalDescription} (${transactionId})`,
      );

      return transactionId;
    }, "createProposal");
  }

  /**
   * Vote on family proposal
   */
  async voteOnProposal(
    contractId: string,
    proposalId: number,
    support: boolean,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "vote",
          new ContractFunctionParameters()
            .addUint256(proposalId)
            .addBool(support),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Voted on proposal ${proposalId}: ${support ? "support" : "oppose"} (${transactionId})`,
      );

      return transactionId;
    }, "voteOnProposal");
  }

  /**
   * Set privacy consent for family member
   */
  async setPrivacyConsent(
    contractId: string,
    familyId: string,
    memberAccountId: string,
    consentLevel: number,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(75000)
        .setFunction(
          "setPrivacyConsent",
          new ContractFunctionParameters()
            .addString(familyId)
            .addAddress(memberAccountId)
            .addUint256(consentLevel), // 0=none, 1=basic, 2=full
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Set privacy consent for ${memberAccountId}: level ${consentLevel} (${transactionId})`,
      );

      return transactionId;
    }, "setPrivacyConsent");
  }

  /**
   * Execute arbitrary contract function
   */
  async executeContractFunction(
    contractCall: SmartContractCall,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const params = new ContractFunctionParameters();

      // Add parameters based on their types
      for (const param of contractCall.parameters) {
        switch (param.type) {
          case "string":
            params.addString(param.value);
            break;
          case "uint256":
            params.addUint256(param.value);
            break;
          case "address":
            params.addAddress(param.value);
            break;
          case "bool":
            params.addBool(param.value);
            break;
          default:
            console.warn(`Unsupported parameter type: ${param.type}`);
        }
      }

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractCall.contractId))
        .setGas(contractCall.gas)
        .setFunction(contractCall.functionName, params);

      if (contractCall.payableAmount) {
        transaction.setPayableAmount(
          Hbar.fromTinybars(contractCall.payableAmount),
        );
      }

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(
        `✅ Executed contract function ${contractCall.functionName}: ${transactionId}`,
      );

      return transactionId;
    }, "executeContractFunction");
  }

  /**
   * Query contract function (read-only)
   */
  async queryContractFunction(
    contractId: string,
    functionName: string,
    parameters: any[] = [],
  ): Promise<HederaServiceResponse<any>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const params = new ContractFunctionParameters();

      // This is a simplified parameter handling - would need more robust typing
      for (const param of parameters) {
        if (typeof param === "string") {
          params.addString(param);
        } else if (typeof param === "number") {
          params.addUint256(param);
        } else if (typeof param === "boolean") {
          params.addBool(param);
        }
      }

      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction(functionName, params);

      const result = await query.execute(client);

      // Return raw result - would need ABI parsing for structured data
      return result;
    }, "queryContractFunction");
  }

  // ============================================================================
  // TREASURY CONTRACT METHODS
  // ============================================================================

  /**
   * Deploy family treasury contract
   */
  async deployTreasuryContract(
    familyId: string,
    adminAccountId: string,
    signers: string[],
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractCreateTransaction()
        .setBytecode(new Uint8Array(0)) // Would load from compiled contract
        .setGas(200000)
        .setConstructorParameters(
          new ContractFunctionParameters()
            .addString(familyId)
            .addAddress(adminAccountId)
            .addUint256(signers.length),
        );

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      if (!receipt.contractId) {
        throw new Error("Failed to deploy treasury contract");
      }

      const contractId = receipt.contractId.toString();
      console.log(`✅ Deployed treasury contract: ${contractId} for family: ${familyId}`);

      return contractId;
    }, "deployTreasuryContract");
  }

  /**
   * Execute treasury transaction (requires multi-sig)
   */
  async executeTreasuryTransaction(
    contractId: string,
    toAccountId: string,
    amount: number,
    tokenId?: string,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "executeTransaction",
          new ContractFunctionParameters()
            .addAddress(toAccountId)
            .addUint256(amount)
            .addString(tokenId || ""),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(`✅ Treasury transaction executed: ${transactionId}`);
      return transactionId;
    }, "executeTreasuryTransaction");
  }

  /**
   * Get treasury balance
   */
  async getTreasuryBalance(
    contractId: string,
  ): Promise<HederaServiceResponse<{ hbar: number; tokens: Record<string, number> }>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const query = new ContractCallQuery()
        .setContractId(ContractId.fromString(contractId))
        .setGas(50000)
        .setFunction("getBalance", new ContractFunctionParameters());

      const result = await query.execute(client);

      // Simplified return - would parse from contract result
      const balance = {
        hbar: 0,
        tokens: {},
      };

      console.log(`[Treasury] Balance for ${contractId}:`, balance);
      return balance;
    }, "getTreasuryBalance");
  }

  // ============================================================================
  // GOVERNANCE DAO METHODS
  // ============================================================================

  /**
   * Deploy governance DAO contract
   */
  async deployGovernanceDAO(
    familyId: string,
    name: string,
    votingPeriod: number = 604800, // 1 week
    quorum: number = 50, // 50% threshold
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractCreateTransaction()
        .setBytecode(new Uint8Array(0)) // Would load from compiled contract
        .setGas(300000)
        .setConstructorParameters(
          new ContractFunctionParameters()
            .addString(familyId)
            .addString(name)
            .addUint256(votingPeriod)
            .addUint256(quorum),
        );

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      if (!receipt.contractId) {
        throw new Error("Failed to deploy DAO contract");
      }

      const contractId = receipt.contractId.toString();
      console.log(`✅ Deployed governance DAO: ${contractId} for family: ${familyId}`);

      return contractId;
    }, "deployGovernanceDAO");
  }

  /**
   * Submit a proposal to the DAO
   */
  async submitProposal(
    contractId: string,
    proposerAccountId: string,
    title: string,
    description: string,
  ): Promise<HederaServiceResponse<number>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(150000)
        .setFunction(
          "submitProposal",
          new ContractFunctionParameters()
            .addString(title)
            .addString(description)
            .addAddress(proposerAccountId),
        );

      const response = await transaction.execute(client);
      const receipt = await response.getReceipt(client);

      // Simplified - would get proposal ID from event logs
      const proposalId = Date.now();
      console.log(`✅ Proposal submitted: ${proposalId} to DAO: ${contractId}`);

      return proposalId;
    }, "submitProposal");
  }

  /**
   * Cast a vote on a proposal
   */
  async castVote(
    contractId: string,
    proposalId: number,
    voterAccountId: string,
    support: boolean,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(100000)
        .setFunction(
          "castVote",
          new ContractFunctionParameters()
            .addUint256(proposalId)
            .addAddress(voterAccountId)
            .addBool(support),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(`✅ Vote cast on proposal ${proposalId}: ${support ? "FOR" : "AGAINST"}`);
      return transactionId;
    }, "castVote");
  }

  /**
   * Execute a passed proposal
   */
  async executeProposal(
    contractId: string,
    proposalId: number,
  ): Promise<HederaServiceResponse<string>> {
    return this.hederaService.executeWithRetry(async () => {
      const client = this.hederaService.getClient();

      const transaction = new ContractExecuteTransaction()
        .setContractId(ContractId.fromString(contractId))
        .setGas(200000)
        .setFunction(
          "executeProposal",
          new ContractFunctionParameters().addUint256(proposalId),
        );

      const response = await transaction.execute(client);
      const transactionId = response.transactionId.toString();

      console.log(`✅ Proposal ${proposalId} executed`);
      return transactionId;
    }, "executeProposal");
  }
}
