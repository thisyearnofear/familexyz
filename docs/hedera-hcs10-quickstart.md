---
title: Hedera HCS-10 Quick Start
description: Send, retrieve, and validate HCS-10 messages using HederaCore services
---

This guide shows the minimal workflow to use the integrated Hedera services to send an HCS-10 message, retrieve it from the Mirror Node, and validate it.

Prerequisites

- Node 18+
- `pnpm` installed
- Hedera Testnet credentials
  - `HEDERA_ACCOUNT_ID`
  - `HEDERA_PRIVATE_KEY`

Environment setup

Create a `.env` at the repo root:

```
HEDERA_NETWORK=testnet
HEDERA_ACCOUNT_ID=0.0.xxxxx
HEDERA_PRIVATE_KEY=302e020100300506032b6570...
```

Minimal example

```ts
import { HederaService } from '@elizaos/hedera-core/services';
import { HederaStandardsService } from '@elizaos/hedera-core/services';
import { HCS10FamilyInteraction } from '@elizaos/hedera-core/types';

async function run() {
  const hederaService = HederaService.getInstance({
    accountId: process.env.HEDERA_ACCOUNT_ID!,
    privateKey: process.env.HEDERA_PRIVATE_KEY!,
    network: (process.env.HEDERA_NETWORK || 'testnet') as 'testnet' | 'mainnet'
  });
  await hederaService.initialize();

  // Create a topic for your family/app
  const topicRes = await hederaService.consensus.createFamilyTopic(
    'quickstart-family',
    'Quick Start Topic'
  );
  if (!topicRes.success || !topicRes.data) throw new Error('Topic creation failed');
  const topicId = topicRes.data;

  // Submit an HCS-10 message
  const msg: HCS10FamilyInteraction = {
    standard: 'HCS-10',
    version: '1.0',
    timestamp: Date.now(),
    messageId: `quickstart-${Date.now()}`,
    sender: process.env.HEDERA_ACCOUNT_ID!,
    topicId,
    type: 'family_interaction',
    payload: {
      familyId: 'quickstart-family',
      agentType: 'coordinator',
      interactionType: 'daily_checkin',
      contentHash: 'hash-abc',
      participants: ['alice','bob'],
      sentiment: { polarity: 0.7, familyTone: 'positive', healthScore: 80 },
      metadata: { mood: 'positive' }
    }
  };
  const submitRes = await hederaService.consensus.submitHCS10Message(topicId, msg);
  if (!submitRes.success) throw new Error(`Submit failed: ${submitRes.error}`);

  // Retrieve from Mirror Node
  const mirrorRes = await hederaService.mirror.getTopicMessages(topicId, { limit: 10 });
  if (!mirrorRes.success || !mirrorRes.data?.length) throw new Error('No messages retrieved');

  // Parse and validate
  const standards = new HederaStandardsService(hederaService);
  const base64 = mirrorRes.data[mirrorRes.data.length - 1].message;
  const json = Buffer.from(base64, 'base64').toString();
  const parse = standards.parseHCS10Message(json);
  if (!parse.isValid) throw new Error(`Invalid HCS-10: ${parse.error}`);

  const validate = standards.validateHCS10Message(parse.message!);
  if (!validate.isValid) throw new Error(`Validation errors: ${validate.errors.join(', ')}`);

  console.log('HCS-10 quickstart completed:', parse.message?.type);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
```

Next steps

- Run the smoke test script: `pnpm --filter @elizaos/hedera-core smoke:e2e`.
- Use the CI workflow “Hedera E2E Smoke” to validate on Testnet.
- Integrate with `HederaTopicRegistry` for multi-agent discovery and coordination.