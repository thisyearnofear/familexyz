/**
 * Database Initialization Module
 * 
 * Handles database adapter creation and initialization
 * for multiple database backends: SQLite, PostgreSQL, Supabase, Qdrant, PGLite
 * 
 * Follows CLEAN principle: clear separation of database concerns.
 */

import { elizaLogger, type IDatabaseAdapter, type IDatabaseCacheAdapter } from "@elizaos/core";
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedDb: IDatabaseAdapter & IDatabaseCacheAdapter | null = null;
let cachedDataDir: string | null = null;

/**
 * Initialize the appropriate database adapter based on environment variables
 * Uses singleton pattern to reuse the same database connection for all characters
 */
export async function initializeDatabase(dataDir: string): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    // Return cached database if already initialized for same dataDir
    if (cachedDb && cachedDataDir === dataDir) {
        elizaLogger.info("Reusing existing SQLite database connection");
        return cachedDb;
    }
    
    // Supabase - Cloud PostgreSQL
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        return initializeSupabase();
    }
    
    // PostgreSQL - Self-hosted
    if (process.env.POSTGRES_URL) {
        return initializePostgres();
    }
    
    // PGLite - In-memory PostgreSQL
    if (process.env.PGLITE_DATA_DIR) {
        return initializePGLite();
    }
    
    // Qdrant - Vector database
    if (process.env.QDRANT_URL && process.env.QDRANT_KEY && process.env.QDRANT_PORT && process.env.QDRANT_VECTOR_SIZE) {
        return initializeQdrant();
    }
    
    // SQLite - Default local database
    return initializeSQLite(dataDir);
}

/**
 * Initialize Supabase database adapter
 */
async function initializeSupabase(): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    elizaLogger.info("Initializing Supabase connection...");
    
    const { SupabaseDatabaseAdapter } = await import("@elizaos/adapter-supabase");
    const db = new SupabaseDatabaseAdapter(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY!
    );

    await db.init();
    elizaLogger.success("Successfully connected to Supabase database");

    return db as IDatabaseAdapter & IDatabaseCacheAdapter;
}

/**
 * Initialize PostgreSQL database adapter
 */
async function initializePostgres(): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    elizaLogger.info("Initializing PostgreSQL connection...");
    
    const { PostgresDatabaseAdapter } = await import("@elizaos/adapter-postgres");
    const db = new PostgresDatabaseAdapter({
        connectionString: process.env.POSTGRES_URL,
        parseInputs: true,
    });

    await db.init();
    elizaLogger.success("Successfully connected to PostgreSQL database");

    return db as IDatabaseAdapter & IDatabaseCacheAdapter;
}

/**
 * Initialize PGLite (in-memory PostgreSQL) adapter
 */
async function initializePGLite(): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    elizaLogger.info("Initializing PgLite adapter...");
    
    const { PGLiteDatabaseAdapter } = await import("@elizaos/adapter-pglite");
    const db = new PGLiteDatabaseAdapter({
        dataDir: process.env.PGLITE_DATA_DIR,
    });

    return db as IDatabaseAdapter & IDatabaseCacheAdapter;
}

/**
 * Initialize Qdrant vector database adapter
 */
async function initializeQdrant(): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    elizaLogger.info("Initializing Qdrant adapter...");
    
    const { QdrantDatabaseAdapter } = await import("@elizaos/adapter-qdrant");
    const db = new QdrantDatabaseAdapter(
        process.env.QDRANT_URL!,
        process.env.QDRANT_KEY!,
        Number(process.env.QDRANT_PORT),
        Number(process.env.QDRANT_VECTOR_SIZE)
    );

    return db as IDatabaseAdapter & IDatabaseCacheAdapter;
}

/**
 * Initialize SQLite database adapter (default)
 * Uses singleton pattern to reuse connection
 */
async function initializeSQLite(dataDir: string): Promise<IDatabaseAdapter & IDatabaseCacheAdapter> {
    const filePath = process.env.SQLITE_FILE ?? path.resolve(dataDir, "db.sqlite");
    
    // Return cached database if already initialized
    if (cachedDb && cachedDataDir === dataDir) {
        elizaLogger.info("Reusing existing SQLite database connection");
        return cachedDb;
    }
    
    elizaLogger.info(`Initializing SQLite database at ${filePath}...`);
    
    const req = createRequire(import.meta.url);
    const BetterSqlite3 = req("better-sqlite3");
    const { SqliteDatabaseAdapter } = await import("@elizaos/adapter-sqlite");
    
    const db = new SqliteDatabaseAdapter(new BetterSqlite3(filePath));

    await db.init();
    elizaLogger.success("Successfully connected to SQLite database");

    // Cache the database for reuse
    cachedDb = db;
    cachedDataDir = dataDir;

    return db as IDatabaseAdapter & IDatabaseCacheAdapter;
}