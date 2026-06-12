import { elizaLogger } from "@elizaos/core";

interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 2, baseDelayMs = 1000 } = options;
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        elizaLogger.warn(`[LLM] Attempt ${attempt + 1} failed, retrying in ${delay}ms: ${lastError.message}`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError!;
}
