/**
 * XMTP Client for FamilyXYZ
 * 
 * Web3-native encrypted messaging using @xmtp/xmtp-js
 * Implements FamilyMessagingAdapter interface
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
