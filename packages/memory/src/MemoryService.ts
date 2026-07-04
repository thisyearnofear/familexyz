/**
 * MemoryService — abstraction over the Cognee memory layer.
 *
 * Every method is designed to fail gracefully: if Cognee is unavailable,
 * disabled, or errors, the caller's primary workflow is unaffected.
 * The app continues to work with its existing SQLite-backed state.
 */

export interface RememberMetadata {
    /** Source event type: "checkin" | "interaction" | "conversation" | "family_add" */
    source?: string;
    /** Agent involved (if any) */
    agent?: string;
    /** Family member name (if relevant) */
    member?: string;
    [key: string]: unknown;
}

export interface MemoryService {
    /**
     * Store a piece of information in the memory graph.
     * Fire-and-forget: failures are logged but never thrown.
     */
    remember(userId: string, content: string, metadata?: RememberMetadata): Promise<void>;

    /**
     * Query the memory graph for relevant context.
     * Returns an array of text snippets. Empty array on failure or no results.
     */
    recall(userId: string, query: string): Promise<string[]>;

    /**
     * Run post-ingestion enrichment on the user's memory graph.
     * Fire-and-forget: failures are logged but never thrown.
     */
    improve(userId: string): Promise<void>;

    /**
     * Surgically remove all memory for a user (dataset deletion).
     * Fire-and-forget: failures are logged but never thrown.
     */
    forget(userId: string): Promise<void>;

    /** Whether the Cognee backend is configured and active. */
    isEnabled(): boolean;
}
