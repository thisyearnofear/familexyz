/**
 * HCS Message Receipt Logger
 * 
 * Logs XMTP message hashes to Hedera Consensus Service
 * Creates verifiable proof of agent interactions without revealing content
 * 
 * Follows existing HederaConsensusService pattern
 */

import type { HederaService } from "@elizaos/hedera-core";

/**
 * Message receipt data for HCS logging
 */
export interface MessageReceipt {
    /** Unique message identifier */
    messageId: string;
    /** Conversation identifier */
    conversationId: string;
    /** Sender address/wallet */
    sender: string;
    /** Recipient (agent) identifier */
    recipient: string;
    /** Message timestamp */
    timestamp: number;
    /** Content hash (SHA-256 of message content) */
    contentHash: string;
    /** Message type */
    messageType: "xmtp" | "telegram" | "direct";
    /** Platform-specific metadata */
    metadata?: Record<string, unknown>;
}

/**
 * HCS topic message for receipt logging
 */
interface HcsReceiptMessage {
    /** Receipt version */
    v: string;
    /** Message ID */
    mid: string;
    /** Conversation ID */
    cid: string;
    /** Sender */
    s: string;
    /** Recipient */
    r: string;
    /** Timestamp */
    ts: number;
    /** Content hash */
    h: string;
    /** Type */
    t: string;
}

/**
 * Log message receipt to HCS
 * Creates immutable proof of interaction without revealing content
 */
export async function logMessageReceiptToHcs(
    hederaService: HederaService,
    receipt: MessageReceipt
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
        // Create compact receipt message
        const hcsMessage: HcsReceiptMessage = {
            v: "1.0",
            mid: receipt.messageId,
            cid: receipt.conversationId,
            s: receipt.sender,
            r: receipt.recipient,
            ts: receipt.timestamp,
            h: receipt.contentHash,
            t: receipt.messageType,
        };

        // Serialize to JSON
        const messageBody = JSON.stringify(hcsMessage);

        // Submit to HCS topic
        const result = await hederaService.submitTopicMessage(
            receipt.metadata?.hcsTopicId as string,
            messageBody
        );

        if (result.success) {
            console.log(
                `[HCS] Message receipt logged: ${receipt.messageId} → ${result.transactionId}`
            );
            return {
                success: true,
                transactionId: result.transactionId,
            };
        } else {
            console.error("[HCS] Failed to log message receipt:", result.error);
            return {
                success: false,
                error: result.error,
            };
        }
    } catch (error) {
        console.error(
            "[HCS] Message receipt logging error:",
            error instanceof Error ? error.message : error
        );
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Generate SHA-256 hash of message content
 * Used for privacy-preserving receipt logging
 */
export async function generateContentHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Verify message against HCS receipt
 * Can be used to prove a message was sent at a specific time
 */
export async function verifyMessageReceipt(
    content: string,
    receipt: MessageReceipt
): Promise<boolean> {
    // Generate hash of provided content
    const contentHash = await generateContentHash(content);

    // Compare with receipt hash
    return contentHash === receipt.contentHash;
}

/**
 * Batch log multiple message receipts to HCS
 * More efficient than individual submissions
 */
export async function batchLogReceiptsToHcs(
    hederaService: HederaService,
    receipts: MessageReceipt[],
    topicId: string
): Promise<{ success: number; failed: number; transactionIds: string[] }> {
    let successCount = 0;
    let failedCount = 0;
    const transactionIds: string[] = [];

    for (const receipt of receipts) {
        const result = await logMessageReceiptToHcs(hederaService, {
            ...receipt,
            metadata: { ...receipt.metadata, hcsTopicId: topicId },
        });

        if (result.success && result.transactionId) {
            successCount++;
            transactionIds.push(result.transactionId);
        } else {
            failedCount++;
        }
    }

    return {
        success: successCount,
        failed: failedCount,
        transactionIds,
    };
}
