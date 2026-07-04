/**
 * @familexyz/memory — Cognee memory layer with graceful degradation.
 *
 * Usage:
 *   import { getMemoryService, initMemoryService } from "@familexyz/memory";
 *
 *   // At boot (agent/src/index.ts):
 *   initMemoryService();
 *
 *   // Anywhere in the app (telegram handlers, direct client, etc.):
 *   const memory = getMemoryService();
 *   await memory.remember(userId, "User checked in: mood=good");
 *   const context = await memory.recall(userId, "What did we discuss last time?");
 *
 * If COGNEE_ENABLED is not "true" (or API key / base URL are missing),
 * a NoopMemoryService is used — all calls are silent no-ops and the app
 * continues to work with its existing SQLite-backed state.
 */

export type { MemoryService, RememberMetadata } from "./MemoryService.js";
export { NoopMemoryService } from "./NoopMemoryService.js";
export { CogneeMemoryService } from "./CogneeMemoryService.js";

import type { MemoryService } from "./MemoryService.js";
import { NoopMemoryService } from "./NoopMemoryService.js";
import { CogneeMemoryService } from "./CogneeMemoryService.js";

let instance: MemoryService = new NoopMemoryService();

/**
 * Initialise the memory service from environment variables.
 * Called once at application boot.
 */
export function initMemoryService(): MemoryService {
    const enabled = process.env.COGNEE_ENABLED === "true";
    const apiKey = process.env.COGNEE_API_KEY;
    const baseUrl = process.env.COGNEE_BASE_URL;

    if (!enabled || !apiKey || !baseUrl) {
        instance = new NoopMemoryService();
        console.info("[Memory] Cognee disabled — using no-op fallback (app fully functional without it)");
        return instance;
    }

    try {
        instance = new CogneeMemoryService(baseUrl, apiKey);
        console.info(`[Memory] Cognee enabled — pointing at ${baseUrl}`);
    } catch (err) {
        console.warn("[Memory] Cognee init failed, falling back to no-op:", err);
        instance = new NoopMemoryService();
    }

    return instance;
}

/**
 * Get the active memory service singleton.
 * Returns a NoopMemoryService if initMemoryService() was never called.
 */
export function getMemoryService(): MemoryService {
    return instance;
}

/** Replace the active service (useful for testing). */
export function setMemoryService(svc: MemoryService): void {
    instance = svc;
}
