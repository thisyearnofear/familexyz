/**
 * XMTP Client for FamilyXYZ
 * 
 * Web3-native encrypted messaging using XMTP Agent SDK
 * Implements FamilyMessagingAdapter interface
 * 
 * Features:
 * - End-to-end encrypted conversations
 * - Built-in SQLite persistence
 * - Event-driven message handling
 * - HCS message receipt logging
 */

export {
    XmtpFamilyClient,
    createXmtpClient,
    type XmtpChannelConfig,
} from "./XmtpFamilyClient.js";

// HCS Receipt Logging
export {
    logMessageReceiptToHcs,
    generateContentHash,
    verifyMessageReceipt,
    batchLogReceiptsToHcs,
    type MessageReceipt,
} from "./HcsReceiptLogger.js";
