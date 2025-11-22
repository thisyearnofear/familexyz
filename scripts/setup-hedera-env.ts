
import {
  Client,
  TopicCreateTransaction,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  PrivateKey,
  AccountId,
  Hbar
} from "@hashgraph/sdk";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  console.log("🚀 Starting Hedera Environment Setup...");

  const accountIdStr = process.env.HEDERA_ACCOUNT_ID;
  const privateKeyStr = process.env.HEDERA_PRIVATE_KEY;

  if (!accountIdStr || !privateKeyStr) {
    console.error("❌ Missing HEDERA_ACCOUNT_ID or HEDERA_PRIVATE_KEY in .env");
    process.exit(1);
  }

  try {
    const accountId = AccountId.fromString(accountIdStr);
    const cleanPrivateKey = privateKeyStr.startsWith("0x") ? privateKeyStr.slice(2) : privateKeyStr;

    // Try to parse key (ECDSA or ED25519)
    let privateKey: PrivateKey;
    try {
      privateKey = PrivateKey.fromStringECDSA(cleanPrivateKey);
    } catch {
      try {
        privateKey = PrivateKey.fromStringED25519(cleanPrivateKey);
      } catch {
        privateKey = PrivateKey.fromStringDer(cleanPrivateKey);
      }
    }

    const client = Client.forTestnet();
    client.setOperator(accountId, privateKey);

    console.log("✅ Connected to Hedera Testnet");

    // 1. Create Wisdom Topic
    console.log("Creating Wisdom Consensus Topic...");
    const topicTx = await new TopicCreateTransaction()
      .setTopicMemo("FamilyXYZ Wisdom Agent Topic")
      .execute(client);
    const topicReceipt = await topicTx.getReceipt(client);
    const topicId = topicReceipt.topicId;
    console.log(`✅ Wisdom Topic Created: ${topicId?.toString()}`);

    // 2. Create Family Token
    console.log("Creating Family Token...");
    const tokenTx = await new TokenCreateTransaction()
      .setTokenName("Family Token")
      .setTokenSymbol("FAM")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(1000000)
      .setTreasuryAccountId(accountId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(privateKey)
      .execute(client);

    const tokenReceipt = await tokenTx.getReceipt(client);
    const tokenId = tokenReceipt.tokenId;
    console.log(`✅ Family Token Created: ${tokenId?.toString()}`);

    console.log("\n\n🎉 SETUP COMPLETE! Copy these values to your .env file:\n");
    console.log("####################################");
    console.log(`HEDERA_OPERATOR_ID=${accountIdStr}`);
    console.log(`HEDERA_OPERATOR_KEY=${privateKeyStr}`);
    console.log(`HEDERA_MIRROR_NODE_URL=https://testnet.mirrornode.hedera.com`);
    console.log("");
    console.log(`# Consensus Topics`);
    console.log(`HEDERA_WISDOM_TOPIC_ID=${topicId?.toString()}`);
    console.log("");
    console.log(`# Tokenomics`);
    console.log(`HEDERA_FAMILY_TOKEN_ID=${tokenId?.toString()}`);
    console.log(`HEDERA_TREASURY_ACCOUNT_ID=${accountIdStr}`);
    console.log("####################################\n");

  } catch (error) {
    console.error("❌ Error executing setup:", error);
    process.exit(1);
  }
}

main();
