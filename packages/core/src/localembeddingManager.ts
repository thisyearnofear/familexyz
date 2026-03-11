import path from "node:path";
import { fileURLToPath } from "url";
import elizaLogger from "./logger";

type FlagEmbedding = {
    init: (options: {
        cacheDir: string;
        model: string;
        maxLength: number;
    }) => Promise<{
        queryEmbed: (input: string) => Promise<number[] | Float32Array | Float32Array[]>;
    }>;
};

let FlagEmbeddingModule: FlagEmbedding | null = null;

async function loadFastembed(): Promise<FlagEmbedding> {
    if (!FlagEmbeddingModule) {
        const module = await import("fastembed");
        FlagEmbeddingModule = module as unknown as FlagEmbedding;
    }
    return FlagEmbeddingModule;
}

class LocalEmbeddingModelManager {
    private static instance: LocalEmbeddingModelManager | null;
    private model: ReturnType<FlagEmbedding["init"]> | null = null;
    private initPromise: Promise<void> | null = null;
    private initializationLock = false;

    private constructor() {}

    public static getInstance(): LocalEmbeddingModelManager {
        if (!LocalEmbeddingModelManager.instance) {
            LocalEmbeddingModelManager.instance =
                new LocalEmbeddingModelManager();
        }
        return LocalEmbeddingModelManager.instance;
    }

    private async getRootPath(): Promise<string> {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const rootPath = path.resolve(__dirname, "..");
        return rootPath.includes("/eliza/")
            ? rootPath.split("/eliza/")[0] + "/eliza/"
            : path.resolve(__dirname, "..");
    }

    public async initialize(): Promise<void> {
        if (this.model) {
            return;
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        if (this.initializationLock) {
            while (this.initializationLock) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
            return;
        }

        this.initializationLock = true;

        try {
            this.initPromise = this.initializeModel();
            await this.initPromise;
        } finally {
            this.initializationLock = false;
            this.initPromise = null;
        }
    }

    private async initializeModel(): Promise<void> {
        const isNode =
            typeof process !== "undefined" &&
            process.versions != null &&
            process.versions.node != null;

        if (!isNode) {
            throw new Error("Local embedding not supported in browser");
        }

        try {
            const fs = await import("fs");
            const cacheDir = (await this.getRootPath()) + "/cache/";

            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            elizaLogger.debug("Initializing BGE embedding model...");

            const FastEmbed = await loadFastembed();
            this.model = await FastEmbed.init({
                cacheDir: cacheDir,
                model: "BGESmallENV15",
                maxLength: 512,
            });

            elizaLogger.debug("BGE model initialized successfully");
        } catch (error) {
            elizaLogger.error("Failed to initialize BGE model:", error);
            throw error;
        }
    }

    public async generateEmbedding(input: string): Promise<number[]> {
        if (!this.model) {
            await this.initialize();
        }

        if (!this.model) {
            throw new Error("Failed to initialize model");
        }

        try {
            const embedding = await this.model.queryEmbed(input);
            return this.processEmbedding(embedding);
        } catch (error) {
            elizaLogger.error("Embedding generation failed:", error);
            throw error;
        }
    }

    private processEmbedding(embedding: number[] | Float32Array | Float32Array[]): number[] {
        let finalEmbedding: number[];

        if (
            ArrayBuffer.isView(embedding) &&
            embedding.constructor === Float32Array
        ) {
            finalEmbedding = Array.from(embedding);
        } else if (
            Array.isArray(embedding) &&
            ArrayBuffer.isView(embedding[0]) &&
            embedding[0].constructor === Float32Array
        ) {
            finalEmbedding = Array.from(embedding[0]);
        } else if (Array.isArray(embedding)) {
            finalEmbedding = embedding as number[];
        } else {
            throw new Error(`Unexpected embedding format: ${typeof embedding}`);
        }

        finalEmbedding = finalEmbedding.map((n) => Number(n));

        if (!Array.isArray(finalEmbedding) || finalEmbedding[0] === undefined) {
            throw new Error(
                "Invalid embedding format: must be an array starting with a number"
            );
        }

        if (finalEmbedding.length !== 384) {
            elizaLogger.warn(
                `Unexpected embedding dimension: ${finalEmbedding.length}`
            );
        }

        return finalEmbedding;
    }

    public async reset(): Promise<void> {
        if (this.model) {
            this.model = null;
        }
        this.initPromise = null;
        this.initializationLock = false;
    }

    public static resetInstance(): void {
        if (LocalEmbeddingModelManager.instance) {
            LocalEmbeddingModelManager.instance.reset();
            LocalEmbeddingModelManager.instance = null;
        }
    }
}

export default LocalEmbeddingModelManager;
