/**
 * Hedera Telegram Handlers
 * 
 * Commands for interacting with the FamilyXYZ Hedera plugin:
 * - /hedera - Show Hedera connection status
 * - /reward - Trigger a family reward payout
 * - /milestone - Log a family milestone to HCS
 * - /transfer - Transfer FAM tokens
 * - /balance - Check token balances
 */

import type { Context } from "grammy";
import { Client, AccountId } from "@hashgraph/sdk";
import { elizaLogger } from "@elizaos/core";
import {
    transferFamilyTokens,
    logFamilyMilestone,
    recordAgentPayout,
    type TransferFamilyTokensInput,
    type LogFamilyMilestoneInput,
    type RecordAgentPayoutInput,
    type TransferFamilyTokensResult,
    type ConsensusMessageResult,
} from "@elizaos/familyxyz-hedera-plugin";

// Re-export types for convenience
export interface HederaSessionData {
    hederaConnected: boolean;
    hcsTopicId?: string;
    famTokenId?: string;
    agentId?: string;
    defaultRewardAmount?: number;
}

// Default configuration (can be overridden via environment)
const DEFAULT_CONFIG = {
    hcsTopicId: process.env.HEDERA_HCS_TOPIC_ID || "0.0.7304500",
    famTokenId: process.env.HEDERA_FAM_TOKEN_ID || "0.0.7304501",
    agentId: process.env.HEDERA_AGENT_ID || "familyxyz",
    defaultRewardAmount: 100,
};

// Emoji constants using Unicode escapes
const EMOJI = {
    check: "\u2705",
    cross: "\u274C",
    clock: "\u23F0",
    trophy: "\u{1F3C6}",
    moneyBag: "\u{1F4B0}",
    pencil: "\u{1F4DD}",
    warning: "\u26A0",
    hourglass: "\u23F3",
    link: "\u{1F517}",
    clock2: "\u{1F551}",
    house: "\u{1F3E0}",
    bank: "\u{1F3E6}",
    chart: "\u{1F4CA}",
    star: "\u{2B50}",
    fire: "\u{1F525}",
    rocket: "\u{1F680}",
    checkmark: "\u2705",
    x: "\u274C",
};

/**
 * Get Hedera client from runtime (assumes runtime has hederaService attached)
 */
function getHederaClient(): Client | null {
    // In production, this would be retrieved from the agent runtime
    // For now, we create a client from environment variables
    const operatorId = process.env.HEDERA_OPERATOR_ID;
    const operatorKey = process.env.HEDERA_OPERATOR_KEY;

    if (!operatorId || !operatorKey) {
        return null;
    }

    try {
        return Client.forTestnet().setOperator(
            AccountId.fromString(operatorId),
            operatorKey
        );
    } catch (error) {
        elizaLogger.error("[Hedera] Failed to create client:", error);
        return null;
    }
}

/**
 * Handle /hedera command - Show Hedera connection status
 */
export async function handleHederaStatus(ctx: Context): Promise<void> {
    const client = getHederaClient();
    const isConnected = !!client;

    let statusText = `${EMOJI.bank} *Hedera Status*\n\n`;
    statusText += `Connection: ${isConnected ? EMOJI.check + " Online" : EMOJI.cross + " Offline"}\n`;
    statusText += `Network: Testnet\n\n`;
    statusText += `*Configuration:*\n`;
    statusText += `HCS Topic: \`${DEFAULT_CONFIG.hcsTopicId}\`\n`;
    statusText += `FAM Token: \`${DEFAULT_CONFIG.famTokenId}\`\n`;
    statusText += `Agent ID: \`${DEFAULT_CONFIG.agentId}\`\n\n`;

    if (isConnected) {
        statusText += `*Available Commands:*\n`;
        statusText += `/milestone - Log a family milestone\n`;
        statusText += `/reward - Trigger a reward payout\n`;
        statusText += `/balance - Check token balances\n`;
        statusText += `/transfer - Transfer FAM tokens\n`;
    } else {
        statusText += `_Set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY to enable Hedera features._`;
    }

    await ctx.reply(statusText, { parse_mode: "Markdown" });
}

/**
 * Handle /milestone command - Log a family milestone to HCS
 */
export async function handleMilestone(ctx: Context): Promise<void> {
    const client = getHederaClient();
    if (!client) {
        await ctx.reply(
            `${EMOJI.cross} *Hedera Not Connected*\n\n` +
            "Configure `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` to enable this feature.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    // Parse milestone details from command args
    const args = ctx.match?.split(" ").filter(Boolean) || [];
    
    if (args.length < 3) {
        await ctx.reply(
            `${EMOJI.pencil} *Log Family Milestone*\n\n` +
            "Usage: `/milestone <familyId> <type> <description>`\n\n" +
            "Example: `/milestone family_xyz challenge_complete Completed weekly challenge`\n\n" +
            "*Milestone Types:*\n" +
            "- `challenge_complete` - Completed a family challenge\n" +
            "- `bond_improved` - Bond score increased\n" +
            "- `checkin_streak` - Achieved check-in milestone\n" +
            "- `goal_achieved` - Reached a family goal",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const [familyId, milestoneType, ...descParts] = args;
    const description = descParts.join(" ");

    const input: LogFamilyMilestoneInput = {
        familyId,
        milestoneType,
        description,
        participants: [ctx.from?.id.toString() || "unknown"],
        rewardAmount: DEFAULT_CONFIG.defaultRewardAmount,
        agentId: DEFAULT_CONFIG.agentId,
    };

    await ctx.reply(`${EMOJI.hourglass} *Logging milestone to Hedera HCS...*`, { parse_mode: "Markdown" });

    try {
        const result: ConsensusMessageResult = await logFamilyMilestone(
            client,
            DEFAULT_CONFIG.hcsTopicId,
            input
        );

        if (result.success) {
            await ctx.reply(
                `${EMOJI.checkmark} *Milestone Logged!*\n\n` +
                `${EMOJI.pencil} Sequence: \`${result.sequenceNumber}\`\n` +
                `${EMOJI.clock2} Timestamp: \`${result.timestamp}\`\n` +
                `${EMOJI.link} Topic: \`${DEFAULT_CONFIG.hcsTopicId}\`\n\n` +
                "_This record is immutable on Hedera._",
                { parse_mode: "Markdown" }
            );
        } else {
            await ctx.reply(
                `${EMOJI.cross} *Failed to log milestone*\n\n${result.message}`,
                { parse_mode: "Markdown" }
            );
        }
    } catch (error) {
        elizaLogger.error("[Hedera] Milestone error:", error);
        await ctx.reply(
            `${EMOJI.cross} *Error logging milestone*\n\nCheck logs for details.`,
            { parse_mode: "Markdown" }
        );
    }
}

/**
 * Handle /reward command - Trigger a family reward payout
 */
export async function handleReward(ctx: Context): Promise<void> {
    const client = getHederaClient();
    if (!client) {
        await ctx.reply(
            `${EMOJI.cross} *Hedera Not Connected*\n\n` +
            "Configure `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` to enable this feature.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const args = ctx.match?.split(" ").filter(Boolean) || [];

    if (args.length < 3) {
        await ctx.reply(
            `${EMOJI.moneyBag} *Family Reward Payout*\n\n` +
            "Usage: `/reward <recipient> <amount> <reason>`\n\n" +
            "Example: `/reward 0.0.123 50 challenge_complete`\n\n" +
            "This will:\n" +
            "1. Log the milestone to HCS\n" +
            "2. Record the payout decision\n" +
            "3. Transfer FAM tokens",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const [recipient, amountStr, ...reasonParts] = args;
    const amount = parseInt(amountStr, 10);
    const reason = reasonParts.join(" ");

    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(`${EMOJI.cross} *Invalid amount*\n\nAmount must be a positive number.`);
        return;
    }

    // Validate recipient format
    if (!recipient.match(/^\d+\.\d+\.\d+$/)) {
        await ctx.reply(
            `${EMOJI.cross} *Invalid account ID format*\n\n` +
            "Use Hedera format: `0.0.123`"
        );
        return;
    }

    const transferInput: TransferFamilyTokensInput = {
        recipientAccountId: recipient,
        amount,
        reason,
        familyId: "telegram_family",
        agentId: DEFAULT_CONFIG.agentId,
    };

    await ctx.reply(`${EMOJI.hourglass} *Processing reward payout...*`, { parse_mode: "Markdown" });

    try {
        // Step 1: Log milestone
        await logFamilyMilestone(client, DEFAULT_CONFIG.hcsTopicId, {
            familyId: "telegram_family",
            milestoneType: "reward_payout",
            description: `Reward of ${amount} FAM for ${reason}`,
            participants: [ctx.from?.id.toString() || "unknown", recipient],
            rewardAmount: amount,
            agentId: DEFAULT_CONFIG.agentId,
        });

        // Step 2: Record payout
        const payoutInput: RecordAgentPayoutInput = {
            agentId: DEFAULT_CONFIG.agentId,
            familyId: "telegram_family",
            weekNumber: Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)),
            scoreDelta: 5,
            finalPayout: amount,
        };
        await recordAgentPayout(client, DEFAULT_CONFIG.hcsTopicId, DEFAULT_CONFIG.famTokenId, payoutInput);

        // Step 3: Transfer tokens
        const transferResult: TransferFamilyTokensResult = await transferFamilyTokens(
            client,
            DEFAULT_CONFIG.famTokenId,
            transferInput
        );

        if (transferResult.success) {
            await ctx.reply(
                `${EMOJI.checkmark} *Reward Payout Complete!*\n\n` +
                `${EMOJI.moneyBag} Amount: *${amount} FAM*\n` +
                `Recipient: \`${recipient}\`\n` +
                `Reason: ${reason}\n\n` +
                `${EMOJI.link} TX ID: \`${transferResult.transactionId}\`\n` +
                `${EMOJI.clock2} Time: \`${transferResult.timestamp}\`\n\n` +
                "_All transactions recorded on Hedera._",
                { parse_mode: "Markdown" }
            );
        } else {
            await ctx.reply(
                `${EMOJI.cross} *Transfer Failed*\n\n${transferResult.message}`,
                { parse_mode: "Markdown" }
            );
        }
    } catch (error) {
        elizaLogger.error("[Hedera] Reward error:", error);
        await ctx.reply(
            `${EMOJI.cross} *Error processing reward*\n\nCheck logs for details.`,
            { parse_mode: "Markdown" }
        );
    }
}

/**
 * Handle /transfer command - Transfer FAM tokens
 */
export async function handleTransfer(ctx: Context): Promise<void> {
    const client = getHederaClient();
    if (!client) {
        await ctx.reply(
            `${EMOJI.cross} *Hedera Not Connected*\n\n` +
            "Configure `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` to enable this feature.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const args = ctx.match?.split(" ").filter(Boolean) || [];

    if (args.length < 2) {
        await ctx.reply(
            `${EMOJI.rocket} *Transfer FAM Tokens*\n\n` +
            "Usage: `/transfer <accountId> <amount>`\n\n" +
            "Example: `/transfer 0.0.123 25`",
            { parse_mode: "Markdown" }
        );
        return;
    }

    const [accountId, amountStr] = args;
    const amount = parseInt(amountStr, 10);

    if (isNaN(amount) || amount <= 0) {
        await ctx.reply(`${EMOJI.cross} *Invalid amount*`);
        return;
    }

    if (!accountId.match(/^\d+\.\d+\.\d+$/)) {
        await ctx.reply(`${EMOJI.cross} *Invalid account ID*\n\nUse format: \`0.0.123\``);
        return;
    }

    await ctx.reply(`${EMOJI.hourglass} *Transferring...*`, { parse_mode: "Markdown" });

    try {
        const result: TransferFamilyTokensResult = await transferFamilyTokens(
            client,
            DEFAULT_CONFIG.famTokenId,
            {
                recipientAccountId: accountId,
                amount,
                reason: "Telegram transfer",
                familyId: "telegram_family",
                agentId: DEFAULT_CONFIG.agentId,
            }
        );

        if (result.success) {
            await ctx.reply(
                `${EMOJI.checkmark} *Transfer Complete!*\n\n` +
                `${EMOJI.moneyBag} Amount: *${amount} FAM*\n` +
                `To: \`${accountId}\`\n` +
                `${EMOJI.link} TX: \`${result.transactionId}\`\n` +
                `${EMOJI.clock2} ${result.timestamp}`,
                { parse_mode: "Markdown" }
            );
        } else {
            await ctx.reply(`${EMOJI.cross} *Transfer Failed*\n\n${result.message}`);
        }
    } catch (error) {
        elizaLogger.error("[Hedera] Transfer error:", error);
        await ctx.reply(`${EMOJI.cross} *Transfer error*`);
    }
}

/**
 * Handle /balance command - Check token balances
 */
export async function handleBalance(ctx: Context): Promise<void> {
    const client = getHederaClient();
    if (!client) {
        await ctx.reply(
            `${EMOJI.cross} *Hedera Not Connected*\n\n` +
            "Configure `HEDERA_OPERATOR_ID` and `HEDERA_OPERATOR_KEY` to enable this feature.",
            { parse_mode: "Markdown" }
        );
        return;
    }

    try {
        const operatorId = client.operatorAccountId?.toString() || "unknown";

        await ctx.reply(
            `${EMOJI.moneyBag} *Token Balances*\n\n` +
            `Operator: \`${operatorId}\`\n` +
            `FAM Token: \`${DEFAULT_CONFIG.famTokenId}\`\n\n` +
            "_Balance check requires mirror node query - coming soon!_",
            { parse_mode: "Markdown" }
        );
    } catch (error) {
        elizaLogger.error("[Hedera] Balance error:", error);
        await ctx.reply(`${EMOJI.cross} *Error checking balance*`);
    }
}

/**
 * Handle /demo command - Showcase the full Hedera integration
 */
export async function handleDemo(ctx: Context): Promise<void> {
    await ctx.reply(
        `${EMOJI.rocket} *FamilyXYZ on Hedera - Demo Walkthrough*\n\n` +
        "_Here\u2019s how our ecosystem works end-to-end:_\n\n" +
        `${EMOJI.star} *1. FAM Token (HTS)*\n` +
        "Custom fungible token on Hedera Token Service.\n" +
        "Used to reward positive family interactions.\n" +
        "Token ID: ``" + DEFAULT_CONFIG.famTokenId + "``\n\n" +
        `${EMOJI.pencil} *2. Milestone Logging (HCS)*\n` +
        "Every family milestone is recorded immutably\n" +
        "on a Hedera Consensus Service topic.\n" +
        "Topic ID: ``" + DEFAULT_CONFIG.hcsTopicId + "``\n\n" +
        `${EMOJI.moneyBag} *3. Rewards Flow*\n` +
        "Agent detects milestone -> logs to HCS ->\n" +
        "records payout decision -> transfers FAM\n" +
        "tokens via HTS. All on-ledger.\n\n" +
        `${EMOJI.chart} *4. Agent Payout Audit*\n` +
        "Weekly agent performance scores recorded\n" +
        "on HCS with full metadata and proof.\n\n" +
        `${EMOJI.star} *Try it yourself:*\n` +
        "/hedera - Check connection status\n" +
        "/milestone <familyId> <type> <desc> - Log a milestone\n" +
        "/reward <account> <amount> <reason> - Full reward flow\n" +
        "/transfer <account> <amount> - Send FAM tokens\n" +
        "/balance - Check token info\n\n" +
        "_Built for Hedera Hello Future: Ascension - AI & Agents Track_",
        { parse_mode: "Markdown" }
    );
}

/**
 * Register Hedera commands with the bot
 */
export function registerHederaCommands(bot: any): void {
    bot.command("hedera", handleHederaStatus);
    bot.command("milestone", handleMilestone);
    bot.command("reward", handleReward);
    bot.command("transfer", handleTransfer);
    bot.command("balance", handleBalance);
    bot.command("demo", handleDemo);

    elizaLogger.info("[Telegram] Hedera commands registered");
}
