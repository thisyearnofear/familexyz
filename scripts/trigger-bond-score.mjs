/**
 * Manual bond score calculation trigger
 * Usage: node scripts/trigger-bond-score.mjs
 */
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load dotenv for environment vars
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

async function trigger() {
    console.log("[BondScoreTrigger] Loading dependencies...");

    // Use the agent's compiled JS to avoid TS compilation issues
    const { runWeeklyBondScoreCalculation } = await import(
        resolve(__dirname, "../agent/src/jobs/BondScoreScheduler.js")
    );
    const { default: Database } = await import(
        resolve(__dirname, "../node_modules/better-sqlite3")
    );
    const { SqliteDatabaseAdapter } = await import(
        resolve(__dirname, "../node_modules/@elizaos/adapter-sqlite")
    );

    // Initialize a direct SQLite connection
    const dataDir = resolve(__dirname, "../agent/data");
    const filePath = process.env.SQLITE_FILE || resolve(dataDir, "db.sqlite");
    console.log(`[BondScoreTrigger] Opening database: ${filePath}`);

    const sqliteDb = new Database(filePath);

    // Create a minimal adapter that exposes all() and run()
    const db = {
        all: (sql, params) => sqliteDb.prepare(sql).all(...(params || [])),
        run: (sql, params) => sqliteDb.prepare(sql).run(...(params || [])),
        get: (sql, params) => sqliteDb.prepare(sql).get(...(params || [])),
        close: () => sqliteDb.close(),
    };

    console.log("[BondScoreTrigger] Running bond score calculation...");
    try {
        await runWeeklyBondScoreCalculation(db);
        console.log("[BondScoreTrigger] Calculation completed successfully!");
    } catch (err) {
        console.error("[BondScoreTrigger] Calculation failed:", err);
        process.exit(1);
    } finally {
        db.close();
    }
}

trigger();
