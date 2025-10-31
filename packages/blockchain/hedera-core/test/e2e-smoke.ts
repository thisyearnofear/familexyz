import 'dotenv/config';
import { HederaService } from '../src/services/HederaService.js';
import { HederaStandardsService } from '../src/services/HederaStandardsService.js';
import { HCS10FamilyInteraction } from '../src/types/hcs10.js';

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet';

  if (!accountId || !privateKey) {
    console.log('Skipping smoke test - Hedera credentials not provided');
    process.exit(0);
  }

  const hedera = HederaService.getInstance({ accountId, privateKey, network });
  await hedera.initialize();

  const topicRes = await hedera.consensus.createFamilyTopic('smoke-family', 'HCS-10 CI Smoke Topic');
  if (!topicRes.success || !topicRes.data) {
    throw new Error(`Topic creation failed: ${topicRes.error}`);
  }
  const topicId = topicRes.data;
  console.log('Topic created:', topicId);

  const interaction: HCS10FamilyInteraction = {
    standard: 'HCS-10',
    version: '1.0',
    timestamp: Date.now(),
    messageId: `smoke-${Date.now()}`,
    sender: accountId,
    topicId,
    type: 'family_interaction',
    payload: {
      familyId: 'smoke-family',
      agentType: 'coordinator',
      interactionType: 'daily_checkin',
      contentHash: 'ci-smoke-hash',
      participants: ['alice','bob'],
      sentiment: { polarity: 0.5, familyTone: 'neutral', healthScore: 70 },
      metadata: { source: 'ci-smoke' }
    }
  };

  const submitRes = await hedera.consensus.submitHCS10Message(topicId, interaction);
  if (!submitRes.success) {
    throw new Error(`Submit failed: ${submitRes.error}`);
  }
  console.log('Message submitted');

  // Wait for Mirror Node
  await new Promise(r => setTimeout(r, 5000));

  const mirrorRes = await hedera.mirror.getTopicMessages(topicId, { limit: 10 });
  if (!mirrorRes.success || !mirrorRes.data || mirrorRes.data.length === 0) {
    throw new Error('No messages retrieved from Mirror Node');
  }

  const standards = new HederaStandardsService({
    accountId,
    privateKey,
    network,
  });
  const last = mirrorRes.data[mirrorRes.data.length - 1];
  const json = Buffer.from(last.message, 'base64').toString();
  const parse = standards.parseHCS10Message(json);
  if (!parse.isValid || !parse.message) {
    throw new Error(`Invalid HCS-10: ${parse.error}`);
  }

  const validation = standards.validateHCS10Message(parse.message);
  if (!validation.isValid) {
    throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
  }

  console.log('Smoke test passed. Type:', parse.message.type);
}

main().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});