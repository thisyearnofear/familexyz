import { z } from "zod";

// ModelProviderName union for typing
export enum ModelProviderName {
  OPENAI = "openai",
  FAL = "fal",
  MISTRAL = "mistral",
  GROQ = "groq",
  ANTHROPIC = "anthropic",
  OLLAMA = "ollama",
  LLAMALOCAL = "llamalocal",
  NINETEEN_AI = "nineteen_ai",
  GAIANET = "gaianet",
  ETERNALAI = "eternalai",
  LLAMACLOUD = "llamacloud",
  TOGETHER = "together",
  CLAUDE_VERTEX = "claude_vertex",
  REDPILL = "redpill",
  OPENROUTER = "openrouter",
  GROK = "grok",
  HEURIST = "heurist",
  GALADRIEL = "galadriel",
  ALI_BAILIAN = "ali_bailian",
  VOLENGINE = "volengine",
  NANOGPT = "nanogpt",
  HYPERBOLIC = "hyperbolic",
  VENICE = "venice",
  ATOMA = "atoma",
  NVIDIA = "nvidia",
  AKASH_CHAT_API = "akash_chat_api",
  GOOGLE = "google",
  LETZAI = "letzai",
  INFERA = "infera",
  DEEPSEEK = "deepseek",
  LIVEPEER = "livepeer",
}

const configSchema = z.object({
  DATABASE_PROVIDER: z.enum([
    "sqlite",
    "postgres",
    "supabase",
    "pglite",
    "qdrant",
  ]),
  CACHE_STORE: z.enum(["filesystem", "database", "redis"]),
  SERVER_PORT: z.coerce.number().default(3000),
  MODEL_PROVIDER: z.nativeEnum(ModelProviderName),
  ENABLE_PLUGIN_WEB_SEARCH: z.coerce.boolean().default(true),
  ENABLE_PLUGIN_IMAGE_GEN: z.coerce.boolean().default(true),
  ENABLE_PLUGIN_EVM: z.coerce.boolean().default(true),
  OPENAI_API_KEY: z.string().optional().nullable(),
  FAL_API_KEY: z.string().optional().nullable(),
  EVM_PRIVATE_KEY: z.string().optional().nullable(),
  // Add more secrets as needed
});

export type Config = z.infer<typeof configSchema>;

// Parse config once at boot
const rawEnv = {
  ...process.env,
  SERVER_PORT: process.env.SERVER_PORT ?? "3000",
  ENABLE_PLUGIN_WEB_SEARCH: process.env.ENABLE_PLUGIN_WEB_SEARCH ?? "true",
  ENABLE_PLUGIN_IMAGE_GEN: process.env.ENABLE_PLUGIN_IMAGE_GEN ?? "true",
  ENABLE_PLUGIN_EVM: process.env.ENABLE_PLUGIN_EVM ?? "true",
};

export const config: Config = configSchema.parse(rawEnv);

export const isProd = process.env.NODE_ENV === "production";

export function requireSecret<K extends keyof Config>(
  key: K,
): NonNullable<Config[K]> {
  const secret = config[key];
  if (!secret) throw new Error(`Missing required secret: ${key}`);
  return secret as NonNullable<Config[K]>;
}
