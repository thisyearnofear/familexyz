/**
 * HTTP Server — thin startup wrapper around the Hono app.
 *
 * All routing lives in app.ts. This module handles port binding,
 * retry logic, and startup logging.
 */

import { serve } from "@hono/node-server";
import { elizaLogger, type IDatabaseAdapter } from "@elizaos/core";
import { app } from "./app.js";
import { ServiceRegistry } from "./service-registry.js";

export interface HttpServerConfig {
    port: number;
    primaryDb: IDatabaseAdapter | null;
    runtime?: any;
}

export async function createHttpServer(config: HttpServerConfig): Promise<void> {
    const { port, primaryDb, runtime } = config;

    ServiceRegistry.set("primaryDb", primaryDb);
    ServiceRegistry.set("primaryRuntime", runtime ?? null);

    return new Promise<void>((resolve, reject) => {
        let retries = 0;
        const maxRetries = 3;

        const tryListen = (tryPort: number) => {
            try {
                serve({ fetch: app.fetch, port: tryPort, hostname: "0.0.0.0" }, (info) => {
                    logServerStartup(info.port);
                    resolve();
                });
            } catch (err: any) {
                if (err.code === "EADDRINUSE" && retries < maxRetries) {
                    retries++;
                    const nextPort = tryPort + 1;
                    elizaLogger.warn(`Health port ${tryPort} in use, trying ${nextPort}`);
                    tryListen(nextPort);
                } else {
                    reject(err);
                }
            }
        };

        tryListen(port);
    });
}

function logServerStartup(port: number): void {
    elizaLogger.success(`Health and API server listening on :${port}`);
    elizaLogger.success(`  Health check: http://localhost:${port}/health`);
    elizaLogger.success(`  Bond scores:  http://localhost:${port}/api/families/:familyId/bond-score`);
    elizaLogger.success(`  Daily take:   http://localhost:${port}/daily-take`);
    elizaLogger.success(`  Subscription: http://localhost:${port}/api/subscription/status`);
    elizaLogger.success(`  Marketplace:  http://localhost:${port}/api/marketplace/agents`);
}
