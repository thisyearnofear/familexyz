/**
 * HTTP Server Module
 *
 * Creates and manages the HTTP server for API endpoints.
 * Handles bond score API, payout API, and health checks.
 *
 * Follows MODULAR principle: independent, testable server module.
 */

import http from "http";
import url from "url";
import { elizaLogger, type IDatabaseAdapter } from "@elizaos/core";
import { healthCheck, readinessCheck } from "../health.js";

// Global payout API handler
declare global {
    var payoutApiHandler: any | undefined;
}

// Module-level ref to primaryDb so initializePayoutHandler can use it
let _primaryDb: IDatabaseAdapter | null = null;

export interface HttpServerConfig {
    port: number;
    primaryDb: IDatabaseAdapter | null;
}

/**
 * Allowed origins for CORS (production security)
 */
const ALLOWED_ORIGINS = [
    "https://familexyz.netlify.app",
    "https://famile.xyz",
    "http://localhost:5173",
    "http://localhost:3000",
];

/**
 * Validate and get CORS origin
 */
function getCorsOrigin(reqOrigin?: string): string | null {
    if (!reqOrigin) return null;
    return ALLOWED_ORIGINS.includes(reqOrigin) ? reqOrigin : null;
}

/**
 * Create and start the HTTP API server
 */
export async function createHttpServer(config: HttpServerConfig): Promise<http.Server> {
    const { port, primaryDb } = config;
    _primaryDb = primaryDb;

    const server = http.createServer(async (req, res) => {
        // Add CORS headers with origin validation
        const allowedOrigin = getCorsOrigin(req.headers.origin);
        if (allowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
        }
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            res.statusCode = 200;
            res.end();
            return;
        }

        const parsedUrl = url.parse(req.url || "", true);
        const pathname = parsedUrl.pathname || "";
        
        // Route to appropriate handler
        const routeHandlers = createRouteHandlers(primaryDb);
        
        // Bond Score API
        if (req.method === "GET" && pathname.startsWith("/api/families/") && pathname.endsWith("/bond-score")) {
            return routeHandlers.handleBondScore(req, res, pathname);
        }
        
        // Payout API - Initialize lazily
        if (!global.payoutApiHandler) {
            await initializePayoutHandler();
        }
        
        const handler = global.payoutApiHandler;
        
        // Agent payout history
        if (req.method === "GET" && pathname.startsWith("/api/agents/") && pathname.endsWith("/payouts")) {
            return routeHandlers.handleAgentPayouts(req, res, pathname, parsedUrl.query, handler);
        }
        
        // Agent performance
        if (req.method === "GET" && pathname.startsWith("/api/agents/") && pathname.endsWith("/performance")) {
            return routeHandlers.handleAgentPerformance(req, res, pathname, handler);
        }
        
        // Family payouts
        if (req.method === "GET" && pathname.startsWith("/api/families/") && pathname.endsWith("/payouts")) {
            return routeHandlers.handleFamilyPayouts(req, res, pathname, parsedUrl.query, handler);
        }
        
        // Pending payouts
        if (req.method === "GET" && pathname === "/api/payouts/pending") {
            return routeHandlers.handlePendingPayouts(req, res, handler);
        }
        
        // Calculate payout (dry-run)
        if (req.method === "POST" && pathname === "/api/payouts/calculate") {
            return routeHandlers.handlePayoutCalculate(req, res, handler);
        }
        
        // Anomaly review
        if (req.method === "GET" && pathname === "/api/payouts/anomalies") {
            return routeHandlers.handleAnomalies(req, res, parsedUrl.query, handler);
        }
        
        // File dispute
        if (req.method === "POST" && pathname === "/api/payouts/dispute") {
            return routeHandlers.handleDispute(req, res, handler);
        }

        // Health check endpoint (explicit)
        if (req.method === "GET" && pathname === "/health") {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            }));
            return;
        }

        // Readiness check endpoint (explicit)
        if (req.method === "GET" && pathname === "/ready") {
            res.setHeader("Content-Type", "application/json");
            const ready = await readinessCheck();
            if (ready) {
                res.statusCode = 200;
                res.end(JSON.stringify({
                    status: "ready",
                    timestamp: new Date().toISOString(),
                }));
            } else {
                res.statusCode = 503;
                res.end(JSON.stringify({
                    status: "not ready",
                    timestamp: new Date().toISOString(),
                }));
            }
            return;
        }

        // Default: 404 for unmatched routes
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Not found", pathname }));
    });
    
    return new Promise<http.Server>((resolve, reject) => {
        let retries = 0;
        const maxRetries = 3;

        server.on("error", (err: NodeJS.ErrnoException) => {
            if (err.code === "EADDRINUSE" && retries < maxRetries) {
                retries++;
                const nextPort = port + retries;
                elizaLogger.warn(`Health port ${port + retries - 1} in use, trying ${nextPort}`);
                server.listen(nextPort, "0.0.0.0", () => {
                    logServerStartup(nextPort);
                    resolve(server);
                });
            } else {
                reject(err);
            }
        });
        server.listen(port, "0.0.0.0", () => {
            logServerStartup(port);
            resolve(server);
        });
    });
}

/**
 * Create route handlers with database context
 */
function createRouteHandlers(primaryDb: IDatabaseAdapter | null) {
    return {
        async handleBondScore(req: http.IncomingMessage, res: http.ServerResponse, pathname: string) {
            const pathParts = pathname.split("/");
            const familyId = pathParts[3];
            
            if (!familyId) {
                res.statusCode = 400;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Missing familyId" }));
                return;
            }
            
            try {
                if (!primaryDb || !('query' in primaryDb)) {
                    res.statusCode = 503;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Database not available" }));
                    return;
                }
                
                const scoresQuery = `
                    SELECT 
                        id, family_id, week_number, timestamp,
                        generational_interaction_score, response_reciprocity_score,
                        sentiment_trajectory_score, challenge_completion_score,
                        presence_consistency_score, network_topology_score,
                        hedera_consensus_score, bond_score, trend, week_over_week_delta
                    FROM family_bond_scores
                    WHERE family_id = ?
                    ORDER BY week_number DESC
                    LIMIT 12
                `;
                
                const scores = await (primaryDb as any).query(scoresQuery, [familyId]);
                
                if (!scores || scores.length === 0) {
                    res.statusCode = 404;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "No bond scores found for family", familyId }));
                    return;
                }
                
                const sortedScores = scores.sort((a: any, b: any) => a.week_number - b.week_number);
                const currentScore = scores[0];
                
                const response = {
                    familyId,
                    current: {
                        bondScore: currentScore.bond_score,
                        trend: currentScore.trend,
                        delta: currentScore.week_over_week_delta,
                        timestamp: currentScore.timestamp,
                    },
                    history: sortedScores.map((s: any) => ({
                        week: s.week_number,
                        bondScore: s.bond_score,
                        trend: s.trend,
                        delta: s.week_over_week_delta,
                        timestamp: s.timestamp,
                    })),
                    signals: {
                        generational: currentScore.generational_interaction_score || 0,
                        reciprocity: currentScore.response_reciprocity_score || 0,
                        sentiment: currentScore.sentiment_trajectory_score || 0,
                        challenges: currentScore.challenge_completion_score || 0,
                        presence: currentScore.presence_consistency_score || 0,
                        topology: currentScore.network_topology_score || 0,
                        consensus: currentScore.hedera_consensus_score || 0,
                    },
                };
                
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(response));
            } catch (error) {
                elizaLogger.error("Error fetching bond scores:", error);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Internal server error" }));
            }
        },
        
        async handleAgentPayouts(
            req: http.IncomingMessage,
            res: http.ServerResponse,
            pathname: string,
            query: any,
            handler: any
        ) {
            if (!handler) {
                res.statusCode = 503;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: "Payout services not initialized" }));
                return;
            }
            
            try {
                const pathParts = pathname.split("/");
                const agentId = pathParts[3];
                const weeks = query.weeks ? Number.parseInt(query.weeks as string) : undefined;
                
                const result = await handler.getAgentPayoutHistory(agentId, weeks);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err: any) {
                elizaLogger.error("Error fetching agent payouts:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message }));
            }
        },
        
        async handleAgentPerformance(
            req: http.IncomingMessage,
            res: http.ServerResponse,
            pathname: string,
            handler: any
        ) {
            try {
                const pathParts = pathname.split("/");
                const agentId = pathParts[3];
                
                const result = await handler.getAgentPerformance(agentId);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err: any) {
                elizaLogger.error("Error fetching agent performance:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message }));
            }
        },
        
        async handleFamilyPayouts(
            req: http.IncomingMessage,
            res: http.ServerResponse,
            pathname: string,
            query: any,
            handler: any
        ) {
            try {
                const pathParts = pathname.split("/");
                const familyId = pathParts[3];
                const weeks = query.weeks ? Number.parseInt(query.weeks as string) : undefined;
                
                const result = await handler.getFamilyPayoutHistory(familyId, weeks);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err: any) {
                elizaLogger.error("Error fetching family payouts:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message }));
            }
        },
        
        async handlePendingPayouts(req: http.IncomingMessage, res: http.ServerResponse, handler: any) {
            try {
                const result = await handler.getPendingPayouts();
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err: any) {
                elizaLogger.error("Error fetching pending payouts:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message }));
            }
        },
        
        async handlePayoutCalculate(req: http.IncomingMessage, res: http.ServerResponse, handler: any) {
            let body = "";
            req.on("data", (chunk) => { body += chunk.toString(); });
            req.on("end", async () => {
                try {
                    const { agentId, familyId, previousScore, currentScore } = JSON.parse(body);
                    
                    if (!agentId || !familyId || previousScore === undefined || currentScore === undefined) {
                        res.statusCode = 400;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ error: "Missing required fields" }));
                        return;
                    }
                    
                    const result = await handler.calculatePayoutDryRun(agentId, familyId, previousScore, currentScore);
                    res.statusCode = 200;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(result));
                } catch (err: any) {
                    elizaLogger.error("Error parsing payout calculation request:", err);
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Invalid request body" }));
                }
            });
        },
        
        async handleAnomalies(req: http.IncomingMessage, res: http.ServerResponse, query: any, handler: any) {
            try {
                const limit = query.limit ? Number.parseInt(query.limit as string) : 50;
                const offset = query.offset ? Number.parseInt(query.offset as string) : 0;
                
                const result = await handler.getAnomalyReview(limit, offset);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result));
            } catch (err: any) {
                elizaLogger.error("Error fetching anomalies:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ error: err.message }));
            }
        },
        
        async handleDispute(req: http.IncomingMessage, res: http.ServerResponse, handler: any) {
            let body = "";
            req.on("data", (chunk) => { body += chunk.toString(); });
            req.on("end", async () => {
                try {
                    const { payoutRecordId, reason, evidence } = JSON.parse(body);
                    
                    if (!payoutRecordId || !reason) {
                        res.statusCode = 400;
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify({ error: "Missing required fields" }));
                        return;
                    }
                    
                    const result = await handler.filePayoutDispute(payoutRecordId, reason, evidence || "");
                    res.statusCode = result.success ? 200 : 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify(result));
                } catch (err: any) {
                    elizaLogger.error("Error parsing dispute request:", err);
                    res.statusCode = 400;
                    res.setHeader("Content-Type", "application/json");
                    res.end(JSON.stringify({ error: "Invalid request body" }));
                }
            });
        },
    };
}

/**
 * Initialize payout handler lazily
 */
async function initializePayoutHandler(): Promise<void> {
    try {
        const { PayoutService: PSvc, AnomalyDetectionService: ADSvc, HederaPayoutLogger: HPL, HederaTokenService: HTS } = await import("@familexyz/agent-services");
        const { PayoutApiHandler } = await import("../api/index.js");
        
        const hcsTopicId = process.env.HEDERA_WISDOM_TOPIC_ID || "0.0.0";
        const famTokenId = process.env.HEDERA_FAMILY_TOKEN_ID || "0.0.0";
        const treasuryId = process.env.HEDERA_TREASURY_ACCOUNT_ID || process.env.HEDERA_OPERATOR_ID || "0.0.0";

        const payoutService = new PSvc();
        const anomalyService = new ADSvc();

        // Create HCS logger with optional SQLite persistence
        const dbAdapter = _primaryDb && 'query' in _primaryDb
            ? { query: (sql: string, params: any[]) => (_primaryDb as any).query(sql, params) }
            : undefined;
        const hcsLogger = new HPL(hcsTopicId, dbAdapter);

        // Load existing records from DB into memory cache
        if (dbAdapter) {
            const loaded = await hcsLogger.loadFromDb();
            if (loaded > 0) {
                elizaLogger.info(`Loaded ${loaded} payout records from SQLite`);
            }
        }

        const tokenService = new HTS(famTokenId, treasuryId, []);
        
        global.payoutApiHandler = new PayoutApiHandler(payoutService, anomalyService, hcsLogger, tokenService);
        elizaLogger.info(`Payout handler initialized (topic: ${hcsTopicId}, token: ${famTokenId}, db: ${dbAdapter ? 'sqlite' : 'memory-only'})`);
    } catch (err) {
        elizaLogger.warn("Payout services not available:", err);
        global.payoutApiHandler = null;
    }
}

/**
 * Log server startup information
 */
function logServerStartup(port: number): void {
    elizaLogger.success(`Health and API server listening on :${port}`);
    elizaLogger.success(`  Health check: http://localhost:${port}/health`);
    elizaLogger.success(`  Bond scores: http://localhost:${port}/api/families/:familyId/bond-score`);
    elizaLogger.success(`  Payout API:`);
    elizaLogger.success(`    Payouts: GET /api/agents/:agentId/payouts`);
    elizaLogger.success(`    Performance: GET /api/agents/:agentId/performance`);
    elizaLogger.success(`    Family payouts: GET /api/families/:familyId/payouts`);
    elizaLogger.success(`    Pending: GET /api/payouts/pending`);
    elizaLogger.success(`    Calculate: POST /api/payouts/calculate`);
    elizaLogger.success(`    Anomalies: GET /api/payouts/anomalies`);
    elizaLogger.success(`    Dispute: POST /api/payouts/dispute`);
}