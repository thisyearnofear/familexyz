import type { HederaService } from './HederaService.js';
import type { HederaServiceResponse, ConsensusMessage } from '../types/index.js';

/**
 * Lightweight Mirror Node client for topic message retrieval.
 */
export class HederaMirrorService {
  private readonly baseUrl: string;

  constructor(private hederaService: HederaService) {
    const cfg = hederaService.getConfig();
    // Default to Hedera-hosted public Mirror Node endpoints if not provided
    const defaultBase = cfg.network === 'mainnet'
      ? 'https://mainnet.mirrornode.hedera.com/api/v1'
      : cfg.network === 'previewnet'
        ? 'https://previewnet.mirrornode.hedera.com/api/v1'
        : 'https://testnet.mirrornode.hedera.com/api/v1';
    this.baseUrl = cfg.mirrorNodeUrl || defaultBase;
  }

  /**
   * Fetch topic messages from Mirror Node.
   *
   * Options:
   * - limit: number of messages to fetch
   * - startTime: ISO-8601 timestamp string to filter messages after
   * - order: 'asc' | 'desc'
   */
  async getTopicMessages(
    topicId: string,
    options?: { limit?: number; startTime?: string; order?: 'asc' | 'desc' }
  ): Promise<HederaServiceResponse<ConsensusMessage[]>> {
    return this.hederaService.executeWithRetry(async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.set('limit', String(options.limit));
      if (options?.order) params.set('order', options.order);
      if (options?.startTime) params.set('timestamp', `gt:${options.startTime}`);

      const url = `${this.baseUrl}/topics/${encodeURIComponent(topicId)}/messages?${params.toString()}`;

      const res = await fetch(url, { headers: { 'accept': 'application/json' } });
      if (!res.ok) {
        throw new Error(`Mirror Node request failed: ${res.status} ${res.statusText}`);
      }

      const raw = await res.json();
      const json: { messages?: any[] } =
        raw && typeof raw === 'object' ? (raw as { messages?: any[] }) : {};
      const items: any[] = Array.isArray(json.messages) ? json.messages : [];

      const messages: ConsensusMessage[] = items.map((m) => {
        // Mirror Node returns base64-encoded message payload
        const decoded = (() => {
          try {
            return m?.message ? Buffer.from(m.message, 'base64').toString('utf8') : '';
          } catch {
            return '';
          }
        })();

        // Use consensus_timestamp as canonical time; convert to ms epoch for internal use
        const consensusTs: string | undefined = m.consensus_timestamp;
        const timestampMs = (() => {
          if (!consensusTs) return Date.now();
          // Mirror returns seconds (with fractional nanoseconds). Prefer numeric conversion.
          const numeric = Number(consensusTs);
          if (!Number.isNaN(numeric)) return Math.floor(numeric * 1000);
          // Fallback to Date.parse for ISO-like strings
          const parsed = Date.parse(consensusTs);
          return Number.isNaN(parsed) ? Date.now() : Math.floor(parsed);
        })();

        return {
          topicId,
          message: decoded,
          timestamp: timestampMs,
          consensusTimestamp: consensusTs,
          transactionId: m.transaction_id,
        };
      });

      // Return raw messages; executeWithRetry wraps into HederaServiceResponse
      return messages;
    }, 'mirror_getTopicMessages');
  }
}