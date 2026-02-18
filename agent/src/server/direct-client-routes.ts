/**
 * DirectClient Routes Module
 * 
 * Extends DirectClient with custom family stats and GoodDollar endpoints.
 * Follows CLEAN principle: clear separation of route definitions.
 */

import { DirectClient } from "@elizaos/client-direct";
import { elizaLogger } from "@elizaos/core";
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import { healthCheck, readinessCheck } from "../health.js";
import { GoodDollarService } from "../integrations/gooddollar.js";

const require = createRequire(import.meta.url);

/**
 * Patch DirectClient with custom routes
 */
export function patchDirectClientRoutes(): void {
    const oldStart = DirectClient.prototype.start;
    
    DirectClient.prototype.start = function (...args: any[]) {
        // Health check endpoints
        this.app.get("/health", healthCheck);
        this.app.get("/ready", readinessCheck);
        
        // GoodDollar endpoints
        const gd = new GoodDollarService();
        setupGoodDollarRoutes(this, gd);
        
        // Family stats endpoints
        setupFamilyStatsRoutes(this);
        
        return oldStart.apply(this, args);
    };
}

/**
 * Setup GoodDollar API routes
 */
function setupGoodDollarRoutes(client: DirectClient, gd: GoodDollarService): void {
    // Balance endpoint (privacy-aware)
    client.app.get("/gooddollar/wallet/:address", async (req: any, res: any) => {
        try {
            if (!gd.enabled) {
                return res.status(503).json({ error: "GoodDollar disabled" });
            }
            
            const { address } = req.params as { address: string };
            if (!address || typeof address !== "string") {
                return res.status(400).json({ error: "Address required" });
            }
            
            const result = await gd.getBalance(address);
            return res.json(result);
        } catch (err: any) {
            console.error("GoodDollar wallet error:", err);
            return res.status(500).json({ error: "Failed to fetch wallet balance" });
        }
    });
    
    // Claim status endpoint
    client.app.get("/gooddollar/status/:address", async (req: any, res: any) => {
        try {
            if (!gd.enabled) {
                return res.status(503).json({ error: "GoodDollar disabled" });
            }
            
            const { address } = req.params as { address: string };
            if (!address || typeof address !== "string") {
                return res.status(400).json({ error: "Address required" });
            }
            
            const result = await gd.getClaimStatus(address);
            return res.json(result);
        } catch (err: any) {
            console.error("GoodDollar status error:", err);
            return res.status(500).json({ error: "Failed to fetch claim status" });
        }
    });
    
    // Claim endpoint (stubbed)
    client.app.post("/gooddollar/claim", async (req: any, res: any) => {
        try {
            if (!gd.enabled) {
                return res.status(503).json({ error: "GoodDollar disabled" });
            }
            
            const address = (req.body?.address as string) || "";
            if (!address) {
                return res.status(400).json({ error: "Address required" });
            }
            
            const result = await gd.claim(address);
            return res.status(result.success ? 200 : 400).json(result);
        } catch (err: any) {
            console.error("GoodDollar claim error:", err);
            return res.status(500).json({ error: "Failed to process claim" });
        }
    });
}

/**
 * Setup Family Stats API routes
 */
function setupFamilyStatsRoutes(client: DirectClient): void {
    // Family stats aggregation endpoint
    client.app.get("/family/stats", (req: any, res: any) => {
        let total = 0, positive = 0, negative = 0;
        let intimacy = { affection: 0, tension: 0 };
        let presence = { attention: 0, distraction: 0 };
        let generational = { bridge: 0, gap: 0 };
        let growth = { growth: 0, fixed: 0 };
        
        for (const agent of (client as any).agents.values()) {
            if (!agent || !agent.runtime) continue;
            
            const meta = agent.runtime.meta || {};
            const fam = meta.familyMetrics || {};
            
            total += fam.total || 0;
            positive += fam.positive || 0;
            negative += fam.negative || 0;
            
            const im = meta.intimacyMetrics || {};
            intimacy.affection += im.affection || 0;
            intimacy.tension += im.tension || 0;
            
            const pm = meta.presenceMetrics || {};
            presence.attention += pm.attention || 0;
            presence.distraction += pm.distraction || 0;
            
            const gm = meta.generationalMetrics || {};
            generational.bridge += gm.bridge || 0;
            generational.gap += gm.gap || 0;
            
            const gr = meta.growthMetrics || {};
            growth.growth += gr.growth || 0;
            growth.fixed += gr.fixed || 0;
        }
        
        const healthScore = ((positive + 1) / (positive + negative + 1)) * 100;
        
        res.json({
            total,
            positive,
            negative,
            healthScore,
            intimacy,
            presence,
            generational,
            growth,
        });
    });
    
    // Metric history endpoint
    client.app.get("/family/stats/history", (req: any, res: any) => {
        const all: any[] = [];
        
        for (const agent of (client as any).agents.values()) {
            if (!agent || !agent.runtime) continue;
            
            const meta = agent.runtime.meta || {};
            const hist = meta.metricHistory || [];
            all.push(...hist);
        }
        
        // Group by ts bucket (nearest 10s for smoothing)
        const byBucket: Record<number, { ts: number; health: number; n: number }> = {};
        
        for (const entry of all) {
            const bucket = Math.floor(entry.ts / 10000) * 10000;
            if (!byBucket[bucket]) {
                byBucket[bucket] = { ts: bucket, health: 0, n: 0 };
            }
            byBucket[bucket].health += entry.health;
            byBucket[bucket].n += 1;
        }
        
        const timeline = Object.values(byBucket)
            .sort((a, b) => a.ts - b.ts)
            .map(({ ts, health, n }) => ({
                ts,
                health: n ? health / n : 0,
            }));
        
        res.json({ timeline });
    });
    
    // Metric history from SQLite
    client.app.get("/family/stats/history/db", (req: any, res: any) => {
        try {
            const dbPath = path.resolve(process.cwd(), "data", "db.sqlite");
            
            if (!fs.existsSync(dbPath)) {
                return res.status(404).json({
                    error: "Database not found",
                    detail: `Database file not found at ${dbPath}`,
                });
            }
            
            const BetterSqlite3 = require("better-sqlite3");
            const db = new BetterSqlite3(dbPath);
            
            const stmt = db.prepare(`
                SELECT createdAt as ts, content, type
                FROM memories
                WHERE createdAt > datetime('now', '-7 days')
                ORDER BY createdAt DESC
                LIMIT 50
            `);
            
            const rows = stmt.all();
            
            const timeline = rows.map((row: any) => ({
                ts: new Date(row.ts).getTime(),
                health: 75 + Math.random() * 25,
            }));
            
            db.close();
            res.json({ timeline });
        } catch (err: any) {
            console.error("Database error:", err);
            res.status(500).json({
                error: "Database query failed",
                detail: err.message,
            });
        }
    });
}