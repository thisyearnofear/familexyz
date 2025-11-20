
import { Client, TopicCreateTransaction, TopicMessageSubmitTransaction, PrivateKey, AccountId } from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("🚀 Starting Hedera Proof Script...");

  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

  if (!accountIdStr || !privateKeyStr) {
    console.error("❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
    process.exit(1);
  }

  try {
    const accountId = AccountId.fromString(accountIdStr);
    // Strip 0x prefix if present
    const cleanPrivateKey = privateKeyStr.startsWith("0x") ? privateKeyStr.slice(2) : privateKeyStr;

    // Try ED25519 first (most common for Hedera), fallback to ECDSA
    let privateKey: PrivateKey;
    try {
      privateKey = PrivateKey.fromStringED25519(cleanPrivateKey);
      console.log(`🔑 Using ED25519 key`);
    } catch {
      try {
        privateKey = PrivateKey.fromStringECDSA(cleanPrivateKey);
        console.log(`🔑 Using ECDSA key`);
      } catch {
        // Last resort: try DER format
        privateKey = PrivateKey.fromStringDer(cleanPrivateKey);
        console.log(`🔑 Using DER format key`);
      }
    }

    console.log(`🔑 Public Key: ${privateKey.publicKey.toString()}`);

    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);

    console.log("✅ Connected to Hedera Testnet");

    // 1. Create a Topic
    console.log("Creating a new consensus topic...");
    const transaction = new TopicCreateTransaction();
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const topicId = receipt.topicId;

    console.log(`✅ Topic Created: ${topicId?.toString()}`);

    // 2. Submit a Message
    console.log("Submitting proof message to topic...");
    const message = JSON.stringify({
      project: "Famile",
      agent: "Wisdom",
      timestamp: Date.now(),
      proof: "Hedera Integration Working"
    });

    const submitTx = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId!)
      .setMessage(message)
      .execute(client);

    const submitReceipt = await submitTx.getReceipt(client);

    console.log(`✅ Message Submitted!`);
    console.log(`Status: ${submitReceipt.status.toString()}`);
    console.log(`Transaction ID: ${submitTx.transactionId.toString()}`);

    // Format Transaction ID for HashScan (0.0.12345@1234567890.000000000 -> 0.0.12345-1234567890-000000000)
    // Actually HashScan uses standard format or the one with dashes.
    // Let's print the raw ID and a formatted link.

    const txIdRaw = submitTx.transactionId.toString();
    // Convert 0.0.4566806@1732095688.652936493 to 0.0.4566806-1732095688-652936493
    const txIdFormatted = txIdRaw.replace("@", "-").replace(".", "-");

    console.log(`\n🎉 PROOF SUCCESSFUL!`);
    console.log(`Topic ID: ${topicId?.toString()}`);
    console.log(`Transaction ID: ${txIdRaw}`);
    console.log(`HashScan URL: https://hashscan.io/testnet/transaction/${txIdFormatted}`);

  } catch (error) {
    console.error("❌ Error executing Hedera proof:", error);
    process.exit(1);
  }
}

main();
