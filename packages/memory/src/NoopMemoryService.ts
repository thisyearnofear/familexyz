import type { MemoryService, RememberMetadata } from "./MemoryService.js";

/**
 * NoopMemoryService — fallback when Cognee is disabled or unavailable.
 *
 * All operations are silent no-ops. The app continues to function
 * with its existing SQLite-backed persistence.
 */
export class NoopMemoryService implements MemoryService {
    async remember(_userId: string, _content: string, _metadata?: RememberMetadata): Promise<void> {
        // no-op
    }

    async recall(_userId: string, _query: string): Promise<string[]> {
        return [];
    }

    async improve(_userId: string): Promise<void> {
        // no-op
    }

    async forget(_userId: string): Promise<void> {
        // no-op
    }

    isEnabled(): boolean {
        return false;
    }
}
