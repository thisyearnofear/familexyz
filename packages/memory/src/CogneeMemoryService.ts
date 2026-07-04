import type { MemoryService, RememberMetadata } from "./MemoryService.js";

/**
 * CogneeMemoryService — talks to Cognee Cloud (or self-hosted Cognee REST API)
 * via the four lifecycle endpoints documented at https://docs.cognee.ai/:
 *
 *   remember() → POST /api/v1/remember        (multipart: text as .txt file + datasetName)
 *   recall()   → POST /api/v1/recall          (JSON: { query, datasets, searchType })
 *   improve()  → POST /api/v1/improve         (JSON: { datasetName, runInBackground })
 *   forget()   → DELETE /api/v1/datasets/{id} (requires dataset UUID lookup via GET /api/v1/datasets)
 *
 * Every call is wrapped in try/catch. If Cognee is down, credits run out,
 * or the network fails, the method silently degrades — the caller's
 * primary workflow (SQLite-backed app logic) is never broken.
 *
 * Auth: X-Api-Key header (ApiKeyAuth in OpenAPI spec).
 * Per-user isolation: each user gets a dedicated dataset `familexyz_user_<id>`.
 */

const TIMEOUT_MS = 15000;

export class CogneeMemoryService implements MemoryService {
    private readonly baseUrl: string;
    private readonly apiKey: string;

    constructor(baseUrl: string, apiKey: string) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.apiKey = apiKey;
    }

    async remember(userId: string, content: string, metadata?: RememberMetadata): Promise<void> {
        const dataset = this.datasetFor(userId);
        const enriched = this.formatContent(content, metadata);

        try {
            const formData = new FormData();
            const blob = new Blob([enriched], { type: "text/plain" });
            formData.append("data", blob, "memory.txt");
            formData.append("datasetName", dataset);

            const res = await this.fetchWithTimeout("/api/v1/remember", {
                method: "POST",
                headers: { "X-Api-Key": this.apiKey },
                body: formData,
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.warn(`[Cognee] remember failed (${res.status}): ${body.slice(0, 200)}`);
            }
        } catch (err) {
            console.warn(`[Cognee] remember error (degraded mode):`, err instanceof Error ? err.message : err);
        }
    }

    async recall(userId: string, query: string): Promise<string[]> {
        const dataset = this.datasetFor(userId);

        try {
            const res = await this.fetchWithTimeout("/api/v1/recall", {
                method: "POST",
                headers: {
                    "X-Api-Key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    datasets: [dataset],
                    // CHUNKS returns raw text chunks without an LLM call —
                    // cheaper, faster, and gives us text snippets directly.
                    searchType: "CHUNKS",
                    topK: 5,
                }),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.warn(`[Cognee] recall failed (${res.status}): ${body.slice(0, 200)}`);
                return [];
            }

            const data = await res.json();
            return this.extractRecallText(data);
        } catch (err) {
            console.warn(`[Cognee] recall error (degraded mode):`, err instanceof Error ? err.message : err);
            return [];
        }
    }

    async improve(userId: string): Promise<void> {
        const dataset = this.datasetFor(userId);

        try {
            const res = await this.fetchWithTimeout("/api/v1/improve", {
                method: "POST",
                headers: {
                    "X-Api-Key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    datasetName: dataset,
                    runInBackground: true,
                }),
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.warn(`[Cognee] improve failed (${res.status}): ${body.slice(0, 200)}`);
            }
        } catch (err) {
            console.warn(`[Cognee] improve error (degraded mode):`, err instanceof Error ? err.message : err);
        }
    }

    async forget(userId: string): Promise<void> {
        const datasetName = this.datasetFor(userId);

        try {
            // Cognee REST API has no /forget endpoint — deletion is via
            // DELETE /api/v1/datasets/{dataset_id} which requires a UUID.
            // Look up the dataset UUID by name first via GET /api/v1/datasets.
            const datasetId = await this.findDatasetId(datasetName);
            if (!datasetId) {
                // Dataset doesn't exist (or was already deleted) — nothing to do.
                return;
            }

            const res = await this.fetchWithTimeout(`/api/v1/datasets/${datasetId}`, {
                method: "DELETE",
                headers: { "X-Api-Key": this.apiKey },
            });

            if (!res.ok) {
                const body = await res.text().catch(() => "");
                console.warn(`[Cognee] forget failed (${res.status}): ${body.slice(0, 200)}`);
            }
        } catch (err) {
            console.warn("[Cognee] forget error (degraded mode):", err instanceof Error ? err.message : err);
        }
    }

    isEnabled(): boolean {
        return true;
    }

    // --- internals ---

    private datasetFor(userId: string): string {
        return `familexyz_user_${userId}`;
    }

    private formatContent(content: string, metadata?: RememberMetadata): string {
        if (!metadata || Object.keys(metadata).length === 0) {
            return content;
        }
        const metaLines = Object.entries(metadata)
            .filter(([, v]) => v !== undefined && v !== null)
            .map(([k, v]) => `${k}: ${v}`)
            .join("\n");
        return `${content}\n\n---\n${metaLines}`;
    }

    /**
     * Look up a dataset UUID by name via GET /api/v1/datasets.
     * Returns null if the dataset doesn't exist (or on error).
     */
    private async findDatasetId(datasetName: string): Promise<string | null> {
        try {
            const res = await this.fetchWithTimeout("/api/v1/datasets", {
                method: "GET",
                headers: { "X-Api-Key": this.apiKey },
            });

            if (!res.ok) return null;

            const datasets = await res.json();
            if (!Array.isArray(datasets)) return null;

            const match = datasets.find(
                (d: any) => d.name === datasetName,
            );
            return match?.id ?? null;
        } catch {
            return null;
        }
    }

    /**
     * Cognee recall returns an array of typed entries with a `source`
     * discriminator (ResponseQAEntry, ResponseGraphEntry, ResponseGraphContextEntry,
     * ResponseSessionContextEntry, ResponseAgentTraceEntry).
     *
     * For CHUNKS search type, entries are typically ResponseGraphEntry with
     * a `text` or `content` field. We defensively extract text from common
     * fields across all entry types.
     */
    private extractRecallText(data: unknown): string[] {
        if (!Array.isArray(data)) {
            // Some versions return { searchResponse: { result: { data: [...] } } }
            const obj = data as any;
            const nested = obj?.searchResponse?.result?.data;
            if (Array.isArray(nested)) return this.extractRecallText(nested);
            if (typeof data === "string") return [data];
            return [];
        }

        const results: string[] = [];
        for (const item of data) {
            if (typeof item === "string") {
                results.push(item);
            } else if (item && typeof item === "object") {
                // Typed recall entries have a `source` field; the actual
                // text content lives in different fields depending on type.
                const text =
                    item.text ??
                    item.content ??
                    item.answer ??
                    item.response ??
                    item.page_content ??
                    item.chunkText ??
                    item.payload?.text ??
                    item.payload?.content;
                if (typeof text === "string" && text.length > 0) {
                    results.push(text);
                }
            }
        }
        return results;
    }

    private async fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            return await fetch(`${this.baseUrl}${path}`, {
                ...init,
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timer);
        }
    }
}
