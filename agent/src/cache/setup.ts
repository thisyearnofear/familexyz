import {
    CacheManager,
    CacheStore,
    type Character,
    DbCacheAdapter,
    elizaLogger,
    FsCacheAdapter,
    type IDatabaseCacheAdapter,
} from "@elizaos/core";
import path from "path";

export async function initializeCache(
    cacheStore: string,
    character: Character,
    baseDir?: string,
    db?: IDatabaseCacheAdapter,
) {
    switch (cacheStore) {
        case CacheStore.REDIS:
            if (process.env.REDIS_URL) {
                elizaLogger.info("Connecting to Redis...");
                const { RedisClient } = await import("@elizaos/adapter-redis");
                const redisClient = new RedisClient(process.env.REDIS_URL);
                if (!character?.id) {
                    throw new Error("CacheStore.REDIS requires id to be set in character definition");
                }
                return new CacheManager(new DbCacheAdapter(redisClient, character.id));
            }
            throw new Error("REDIS_URL environment variable is not set.");

        case CacheStore.DATABASE:
            if (db) {
                elizaLogger.info("Using Database Cache...");
                return new CacheManager(new DbCacheAdapter(db, character.id!));
            }
            throw new Error("Database adapter is not provided for CacheStore.Database.");

        case CacheStore.FILESYSTEM:
            elizaLogger.info("Using File System Cache...");
            if (!baseDir) {
                throw new Error("baseDir must be provided for CacheStore.FILESYSTEM.");
            }
            const cacheDir = path.resolve(baseDir, character.id!, "cache");
            return new CacheManager(new FsCacheAdapter(cacheDir));

        default:
            throw new Error(`Invalid cache store: ${cacheStore}`);
    }
}
