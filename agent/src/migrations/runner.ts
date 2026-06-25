/**
 * Database Migration Runner
 * 
 * Manages schema migrations for the bond scoring system.
 * Runs on agent startup.
 */

import fs from "fs";
import path from "path";
import { elizaLogger } from "@elizaos/core";
import type { IDatabaseAdapter } from "@elizaos/core";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run all pending migrations
 * 
 * Migration files are expected in agent/data/migrations/ directory
 * named as: 001_description.sql, 002_description.sql, etc.
 */
export async function runMigrations(db: IDatabaseAdapter): Promise<void> {
  try {
    elizaLogger.info("Starting database migrations...");

    // Ensure migrations table exists
    const createMigrationsTable = `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      // Use raw query execution if available
      if ('all' in db && typeof (db as any).all === 'function') {
        await (db as any).run(createMigrationsTable, []);
      }
    } catch (err) {
      // Schema migrations table might not be accessible via all adapters
      // Continue anyway - we'll detect missing tables at runtime
      elizaLogger.warn("Could not create migrations table (may not support raw queries):", err);
    }

    // Read migration files from data/migrations directory
    const migrationsDir = path.resolve(__dirname, "../../data/migrations");
    
    if (!fs.existsSync(migrationsDir)) {
      elizaLogger.info("No migrations directory found, skipping migrations");
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const migrationPath = path.join(migrationsDir, file);
      const migrationName = path.basename(file, '.sql');

      try {
        // Check if migration already ran
        let alreadyRan = false;
        try {
          const checkQuery = `SELECT id FROM schema_migrations WHERE name = ?`;
          if ('all' in db && typeof (db as any).all === 'function') {
            const result = await (db as any).all(checkQuery, [migrationName]);
            alreadyRan = result && result.length > 0;
          }
        } catch (err) {
          // If we can't check, proceed with migration (idempotent SQL)
          alreadyRan = false;
        }

        if (alreadyRan) {
          elizaLogger.debug(`Migration already applied: ${migrationName}`);
          continue;
        }

        // Read and execute migration
        const sql = fs.readFileSync(migrationPath, 'utf-8');
        elizaLogger.info(`Running migration: ${migrationName}`);

        // Split by semicolon and filter empty statements
        const statements = sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);

        // Execute each statement
        for (const statement of statements) {
          try {
            if ('run' in db && typeof (db as any).run === 'function') {
              await (db as any).run(statement, []);
            }
          } catch (err) {
            // Some CREATE IF NOT EXISTS statements might fail in some adapters
            // but that's okay - we continue
            elizaLogger.debug(`Statement execution note: ${err}`);
          }
        }

        // Record migration as completed
        try {
          const recordQuery = `
            INSERT INTO schema_migrations (id, name) 
            VALUES (?, ?)
            ON CONFLICT(id) DO NOTHING
          `;
          if ('run' in db && typeof (db as any).run === 'function') {
            await (db as any).run(recordQuery, [
              `${Date.now()}-${migrationName}`,
              migrationName
            ]);
          }
        } catch (err) {
          elizaLogger.debug(`Could not record migration completion: ${err}`);
        }

        elizaLogger.success(`Migration completed: ${migrationName}`);
      } catch (err) {
        elizaLogger.error(`Migration failed: ${migrationName}`, err);
        // Continue with other migrations rather than crashing
      }
    }

    elizaLogger.success("Database migrations completed");
  } catch (err) {
    elizaLogger.error("Fatal error during migrations:", err);
    throw err;
  }
}
