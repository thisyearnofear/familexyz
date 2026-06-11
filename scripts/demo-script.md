# FamilyXYZ — Hackathon Demo Script (~3 min)

## 1. Hook — The Problem (20s)

"Family wellness platforms today have no accountability. A coach gives advice — did it work? No audit trail, no verifiable outcomes, no alignment between what families achieve and what practitioners get paid.

FamilyXYZ fixes that. Enterprise agents on Hedera, with cryptographic proof of every milestone."

## 2. Live Demo: Enterprise Agent in Action (90s)

**[Open https://famile.xyz — the homepage]**

"We host five enterprise-grade AI coaches — Wisdom, Intimacy, Presence, Growth, Bridge. Each is a full ElizaOS agent with a character file, a model provider, and a plugin stack."

**[Click into Wisdom chat, type: "Help me resolve conflict with my teenager"]**

"The agent invokes the **Hedera Agent Kit** under the hood — every interaction does two things:
1. **Records a milestone on HCS** — immutable, timestamped evidence of engagement
2. **Issues FAM tokens** — the family earns tokens for taking action, not just chatting"

**[Navigate to /dashboard — show Bond Score chart]**

"Bond Score trends are computed from agent interactions and on-chain milestones. Practitioners see this data (privacy-preserving) to adjust interventions."

**[Navigate to /today — Daily Council]**

"Every day, the five agents read one story from the zeitgeist and each responds through their intellectual lens. Wisdom channels Alain de Botton, Intimacy channels Esther Perel, Presence channels Thich Nhat Hanh — real perspectives, not generic advice.

Every interaction — every council take, every chat — is logged to HCS:

- `HederaConsensusMessageSubmit` — logs every milestone to HCS topic `0.0.7304500`
- `HederaTokenTransfer` — distributes FAM token rewards for engagement
- `HederaWalletBalance` — checks token balances (non-query tool)

These are **real Hedera transactions** executing behind every conversation."

## 3. Enterprise Architecture (30s)

- **Multi-agent orchestration** on ElizaOS — primary router delegates to specialized agents, each with distinct personality and knowledge domain
- **Hedera integration layer** handles reward distribution, milestone tracking, and practitioner compensation
- **FAM token** (`0.0.7304501`) aligns incentives around behavioral outcomes: families earn on milestone completion, practitioners earn when families show measurable progress
- **HCS audit trail** (`0.0.7304500`) provides immutable proof of engagement — families, practitioners, and employers all verify outcomes independently

## 4. Commercial Transaction (20s)

"Every demo here executed real Hedera transactions — token associations, HCS messages, and reward transfers. The agent doesn't just talk. It transacts."

## 5. Closing (10s)

"FamilyXYZ. Enterprise agents with verifiable outcomes on Hedera. [https://famile.xyz](https://famile.xyz) — code on GitHub. Happy to answer questions."

---

**Keyboard shortcuts:**
- `/chat/wisdom` — chat with Wisdom agent (demonstrate Hedera transaction)
- `/dashboard` — Bond Score + token balance
- `/today` — Daily Council with five editorial perspectives
- Open [HashScan topic `0.0.7304500`](https://hashscan.io/testnet/topic/0.0.7304500) in a pinned tab to show live HCS messages during demo
