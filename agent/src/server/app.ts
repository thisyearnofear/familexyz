/**
 * Hono application — replaces the hand-rolled http.createServer router.
 *
 * All routes read from ServiceRegistry instead of module-level variables.
 * CORS origins are configured via CORS_ORIGINS env var.
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { elizaLogger } from "@elizaos/core";
import { ServiceRegistry } from "./service-registry.js";
import { getCachedDailyTake, generateDailyTake } from "../jobs/DailyTakeGenerator.js";
import { readinessCheck } from "../health.js";
import { authMiddleware, requireAuth } from "../auth/middleware.js";
import { signToken } from "../auth/jwt.js";

const app = new Hono();

// ── Auth middleware (global, non-blocking) ─────────────
app.use("*", authMiddleware);

// ── CORS ──────────────────────────────────────────────
const origins = (process.env.CORS_ORIGINS || "https://familexyz.netlify.app,https://famile.xyz,http://localhost:5173,http://localhost:3000")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use("*", cors({
    origin: (origin) => {
        if (!origin) return "*";
        return origins.includes(origin) ? origin : undefined;
    },
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));

// ── Health ────────────────────────────────────────────
app.get("/health", (c) => {
    const status = ServiceRegistry.getStatus();
    return c.json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
            total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
        },
        services: status,
    });
});

app.get("/ready", (c) => {
    const result = readinessCheck();
    const ok = result?.status === "ready";
    return c.json(result, ok ? 200 : 503);
});

// ── Daily Take ────────────────────────────────────────
app.get("/daily-take", async (c) => {
    let take = getCachedDailyTake();
    if (!take) {
        const runtime = ServiceRegistry.get("primaryRuntime");
        if (runtime) {
            take = await generateDailyTake(runtime);
        }
    }
    if (!take) {
        return c.json({ error: "Daily take not yet generated" }, 503);
    }
    return c.json(take);
});

// ── Bond Score ────────────────────────────────────────
app.get("/api/families/:familyId/bond-score", async (c) => {
    const { familyId } = c.req.param();
    const db = ServiceRegistry.get("primaryDb");

    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }

    try {
        const scores = await (db as any).all(
            `SELECT id, family_id, week_number, timestamp,
                    generational_interaction_score, response_reciprocity_score,
                    sentiment_trajectory_score, challenge_completion_score,
                    presence_consistency_score, network_topology_score,
                    hedera_consensus_score, bond_score, trend, week_over_week_delta
             FROM family_bond_scores
             WHERE family_id = ?
             ORDER BY week_number DESC
             LIMIT 12`,
            [familyId],
        );

        if (!scores || scores.length === 0) {
            return c.json({ error: "No bond scores found for family", familyId }, 404);
        }

        const sorted = scores.sort((a: any, b: any) => a.week_number - b.week_number);
        const current = scores[0];

        return c.json({
            familyId,
            current: {
                bondScore: current.bond_score,
                trend: current.trend,
                delta: current.week_over_week_delta,
                timestamp: current.timestamp,
            },
            history: sorted.map((s: any) => ({
                week: s.week_number,
                bondScore: s.bond_score,
                trend: s.trend,
                delta: s.week_over_week_delta,
                timestamp: s.timestamp,
            })),
            signals: {
                generational: current.generational_interaction_score || 0,
                reciprocity: current.response_reciprocity_score || 0,
                sentiment: current.sentiment_trajectory_score || 0,
                challenges: current.challenge_completion_score || 0,
                presence: current.presence_consistency_score || 0,
                topology: current.network_topology_score || 0,
                consensus: current.hedera_consensus_score || 0,
            },
        });
    } catch (error) {
        elizaLogger.error("Bond score query error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});

// ── Payout routes (lazy-init handler) ─────────────────
async function getPayoutHandler(c: any) {
    const handler = await ServiceRegistry.ensurePayoutHandler();
    if (!handler) {
        return c.json({ error: "Payout services not initialized" }, 503);
    }
    return handler;
}

app.get("/api/agents/:agentId/payouts", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const { agentId } = c.req.param();
        const weeks = c.req.query("weeks") ? Number.parseInt(c.req.query("weeks")!) : undefined;
        return c.json(await handler.getAgentPayoutHistory(agentId, weeks));
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/agents/:agentId/performance", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const { agentId } = c.req.param();
        return c.json(await handler.getAgentPerformance(agentId));
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/families/:familyId/payouts", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const { familyId } = c.req.param();
        const weeks = c.req.query("weeks") ? Number.parseInt(c.req.query("weeks")!) : undefined;
        return c.json(await handler.getFamilyPayoutHistory(familyId, weeks));
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/payouts/pending", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        return c.json(await handler.getPendingPayouts());
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.post("/api/payouts/calculate", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const body = await c.req.json();
        const { agentId, familyId, previousScore, currentScore } = body;
        if (!agentId || !familyId || previousScore === undefined || currentScore === undefined) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        return c.json(await handler.calculatePayoutDryRun(agentId, familyId, previousScore, currentScore));
    } catch {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

app.get("/api/payouts/anomalies", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const limit = c.req.query("limit") ? Number.parseInt(c.req.query("limit")!) : 50;
        const offset = c.req.query("offset") ? Number.parseInt(c.req.query("offset")!) : 0;
        return c.json(await handler.getAnomalyReview(limit, offset));
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.post("/api/payouts/dispute", async (c) => {
    const handler = await getPayoutHandler(c);
    if (!handler) return;
    try {
        const body = await c.req.json();
        const { payoutRecordId, reason, evidence } = body;
        if (!payoutRecordId || !reason) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const result = await handler.filePayoutDispute(payoutRecordId, reason, evidence || "");
        return c.json(result, result.success ? 200 : 400);
    } catch {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

// ── Auth ──────────────────────────────────────────────
app.post("/api/auth/session", async (c) => {
    try {
        const body = await c.req.json();
        const { accountId, familyId } = body;
        if (!accountId) {
            return c.json({ error: "accountId is required" }, 400);
        }
        const token = signToken({
            sub: accountId,
            accountId,
            familyId: familyId || undefined,
        });
        return c.json({ token, accountId, expiresIn: "30d" });
    } catch {
        return c.json({ error: "Invalid request body" }, 400);
    }
});

app.get("/api/auth/me", async (c) => {
    const user = requireAuth(c);
    if (!user) {
        return c.json({ error: "Not authenticated" }, 401);
    }

    const mono = await ServiceRegistry.ensureMonetization();
    let subscription = null;
    if (mono) {
        subscription = await mono.subscriptionService.getByUser(user.sub);
    }

    return c.json({
        accountId: user.sub,
        familyId: user.familyId || null,
        subscription,
    });
});

// ── Monetization: Subscription ────────────────────────
async function getMonetization() {
    return ServiceRegistry.ensureMonetization();
}

app.get("/api/subscription/status", async (c) => {
    const mono = await getMonetization();
    if (!mono) return c.json({ error: "Monetization services not available" }, 503);
    try {
        const user = requireAuth(c);
        const userId = user?.sub || c.req.query("userId") || "anonymous";
        const subscription = await mono.subscriptionService.getOrCreateFree(userId);
        const usage = await mono.usageTracker.getUsageSummary(userId);
        return c.json({ subscription, usage });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/subscription/usage", async (c) => {
    const mono = await getMonetization();
    if (!mono) return c.json({ error: "Monetization services not available" }, 503);
    try {
        const user = requireAuth(c);
        const userId = user?.sub || c.req.query("userId") || "anonymous";
        const summary = await mono.usageTracker.getUsageSummary(userId);
        return c.json(summary);
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.post("/api/subscription/upgrade", async (c) => {
    const mono = await getMonetization();
    if (!mono) return c.json({ error: "Monetization services not available" }, 503);
    try {
        const user = requireAuth(c);
        if (!user) {
            return c.json({ error: "Authentication required" }, 401);
        }
        const body = await c.req.json();
        const { tier, paymentId, paymentMethod } = body;
        if (!tier) {
            return c.json({ error: "Missing tier" }, 400);
        }
        const subscription = await mono.subscriptionService.upgrade(
            user.sub, tier, paymentId || "pending", paymentMethod || "hedera"
        );
        return c.json({ subscription });
    } catch (err: any) {
        const statusCode = err.statusCode || 500;
        return c.json({ error: err.message, code: err.code }, statusCode);
    }
});

// ── Monetization: Agent Catalog ───────────────────────
app.get("/api/marketplace/agents", async (c) => {
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }
    try {
        const category = c.req.query("category");
        const tier = c.req.query("tier");
        let sql = `SELECT * FROM agent_catalog WHERE is_active = 1`;
        const params: any[] = [];
        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }
        if (tier) {
            const tierOrder: Record<string, number> = { FREE: 0, BASIC: 1, PREMIUM: 2, FAMILY: 3 };
            const tierLevel = tierOrder[tier] ?? 0;
            const tiers = Object.entries(tierOrder)
                .filter(([, v]) => v <= tierLevel)
                .map(([k]) => k);
            sql += ` AND tier_required IN (${tiers.map(() => "?").join(",")})`;
            params.push(...tiers);
        }
        sql += ` ORDER BY name`;
        const agents = await (db as any).all(sql, params);
        return c.json({ agents: agents || [] });
    } catch (err: any) {
        elizaLogger.error("Agent catalog query error:", err);
        return c.json({ error: "Failed to load agent catalog" }, 500);
    }
});

app.get("/api/marketplace/agents/:slug", async (c) => {
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }
    try {
        const { slug } = c.req.param();
        const rows = await (db as any).all(
            `SELECT * FROM agent_catalog WHERE slug = ? AND is_active = 1`,
            [slug]
        );
        if (!rows || rows.length === 0) {
            return c.json({ error: "Agent not found" }, 404);
        }
        const agent = rows[0];

        const mono = await ServiceRegistry.ensureMonetization();
        let subscriptionInfo = null;
        if (mono) {
            const user = requireAuth(c);
            const userId = user?.sub || c.req.query("userId");
            if (userId) {
                const sub = await mono.subscriptionService.getByUser(userId);
                const tierOrder = ["FREE", "BASIC", "PREMIUM", "FAMILY"];
                const userTierIndex = sub ? tierOrder.indexOf(sub.tier) : 0;
                const requiredTierIndex = tierOrder.indexOf(agent.tier_required);
                subscriptionInfo = {
                    userTier: sub?.tier || "FREE",
                    hasAccess: userTierIndex >= requiredTierIndex,
                    requiredTier: agent.tier_required,
                };
            }
        }

        return c.json({ agent, subscriptionInfo });
    } catch (err: any) {
        elizaLogger.error("Agent catalog detail error:", err);
        return c.json({ error: "Failed to load agent details" }, 500);
    }
});

app.post("/api/marketplace/subscribe", async (c) => {
    const user = requireAuth(c);
    if (!user) {
        return c.json({ error: "Authentication required" }, 401);
    }
    const mono = await getMonetization();
    if (!mono) return c.json({ error: "Monetization services not available" }, 503);

    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }

    try {
        const body = await c.req.json();
        const { agentSlug } = body;
        if (!agentSlug) {
            return c.json({ error: "agentSlug is required" }, 400);
        }

        const agents = await (db as any).all(
            `SELECT * FROM agent_catalog WHERE slug = ? AND is_active = 1`,
            [agentSlug]
        );
        if (!agents || agents.length === 0) {
            return c.json({ error: "Agent not found" }, 404);
        }
        const agent = agents[0];

        const sub = await mono.subscriptionService.getByUser(user.sub);
        const tierOrder = ["FREE", "BASIC", "PREMIUM", "FAMILY"];
        const userTierIndex = sub ? tierOrder.indexOf(sub.tier) : 0;
        const requiredTierIndex = tierOrder.indexOf(agent.tier_required);

        if (userTierIndex < requiredTierIndex) {
            return c.json({
                error: "Insufficient subscription tier",
                currentTier: sub?.tier || "FREE",
                requiredTier: agent.tier_required,
                upgradeRequired: true,
            }, 403);
        }

        return c.json({
            success: true,
            agent: { name: agent.name, slug: agent.slug },
            subscription: sub,
        });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/marketplace/family/:familyId/subscriptions", async (c) => {
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }

    try {
        const { familyId } = c.req.param();
        const agents = await (db as any).all(
            `SELECT * FROM agent_catalog WHERE is_active = 1 ORDER BY name`,
            []
        );

        const mono = await ServiceRegistry.ensureMonetization();
        const user = requireAuth(c);

        let subscriptions: any[] = [];
        if (mono && user) {
            const sub = await mono.subscriptionService.getByUser(user.sub);
            const tierOrder = ["FREE", "BASIC", "PREMIUM", "FAMILY"];
            const userTierIndex = sub ? tierOrder.indexOf(sub.tier) : 0;

            subscriptions = (agents || []).map((agent: any) => ({
                id: agent.id,
                name: agent.name,
                slug: agent.slug,
                description: agent.description,
                category: agent.category,
                tierRequired: agent.tier_required,
                hasAccess: userTierIndex >= tierOrder.indexOf(agent.tier_required),
            }));
        } else {
            subscriptions = (agents || []).map((agent: any) => ({
                id: agent.id,
                name: agent.name,
                slug: agent.slug,
                description: agent.description,
                category: agent.category,
                tierRequired: agent.tier_required,
                hasAccess: agent.tier_required === "FREE",
            }));
        }

        return c.json({ familyId, subscriptions });
    } catch (err: any) {
        elizaLogger.error("Family subscriptions error:", err);
        return c.json({ error: "Failed to load family subscriptions" }, 500);
    }
});

// ── Marketplace: Submissions ─────────────────────────
app.post("/api/marketplace/submit", async (c) => {
    const user = requireAuth(c);
    if (!user) {
        return c.json({ error: "Authentication required" }, 401);
    }
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }
    try {
        const body = await c.req.json();
        const { name, slug, description, category, tierRequired, publisherName, publisherEmail, characterJson } = body;
        if (!name || !slug || !description) {
            return c.json({ error: "name, slug, and description are required" }, 400);
        }

        const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const now = Math.floor(Date.now() / 1000);

        await (db as any).run(
            `INSERT INTO agent_submissions (id, name, slug, description, category, tier_required, publisher_id, publisher_name, publisher_email, character_json, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
            [id, name, slug, description, category || "general", tierRequired || "FREE", user.sub, publisherName || null, publisherEmail || null, characterJson ? JSON.stringify(characterJson) : null, now]
        );

        return c.json({ success: true, submissionId: id, status: "pending" });
    } catch (err: any) {
        if (err.message?.includes("UNIQUE")) {
            return c.json({ error: "An agent with that slug already exists" }, 409);
        }
        return c.json({ error: err.message }, 500);
    }
});

app.get("/api/marketplace/pending", async (c) => {
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }
    try {
        const submissions = await (db as any).all(
            `SELECT * FROM agent_submissions WHERE status = 'pending' ORDER BY created_at DESC`,
            []
        );
        return c.json({ submissions: submissions || [] });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

app.post("/api/marketplace/review/:id", async (c) => {
    const user = requireAuth(c);
    if (!user) {
        return c.json({ error: "Authentication required" }, 401);
    }
    const db = ServiceRegistry.get("primaryDb");
    if (!db || !('all' in db)) {
        return c.json({ error: "Database not available" }, 503);
    }
    try {
        const { id } = c.req.param();
        const body = await c.req.json();
        const { action, notes } = body;
        if (!action || !["approved", "rejected"].includes(action)) {
            return c.json({ error: "action must be 'approved' or 'rejected'" }, 400);
        }

        const now = Math.floor(Date.now() / 1000);
        await (db as any).run(
            `UPDATE agent_submissions SET status = ?, review_notes = ?, reviewed_at = ? WHERE id = ?`,
            [action, notes || null, now, id]
        );

        if (action === "approved") {
            const subs = await (db as any).all(
                `SELECT * FROM agent_submissions WHERE id = ?`,
                [id]
            );
            if (subs && subs.length > 0) {
                const sub = subs[0];
                await (db as any).run(
                    `INSERT OR IGNORE INTO agent_catalog (id, name, slug, description, category, tier_required, is_active, publisher_id, created_at, updated_at)
                     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
                    [sub.id.replace("sub-", "agent-"), sub.name, sub.slug, sub.description, sub.category, sub.tier_required, sub.publisher_id, now, now]
                );
            }
        }

        return c.json({ success: true, action });
    } catch (err: any) {
        return c.json({ error: err.message }, 500);
    }
});

export { app };
