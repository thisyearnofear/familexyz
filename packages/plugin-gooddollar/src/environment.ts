import { IAgentRuntime } from "@elizaos/core";
import { z } from "zod";
import type { GDollarConfig, GDollarEnvironment } from "./types.js";

export const gdollarEnvSchema = z.object({
  GOODDOLLAR_NETWORK: z.enum(["celo", "fuse"]).default("fuse"),
  GOODDOLLAR_TOKEN_ADDRESS: z.string().min(1),
  GOODDOLLAR_SUPER_TOKEN_ADDRESS: z.string().optional(),
  GOODDOLLAR_RPC_URL: z.string().url(),
  GOODDOLLAR_PRIVATE_KEY: z.string().min(1),
  GOODDOLLAR_ENABLE_FACE_VERIFICATION: z.string().default("false"),
  GOODDOLLAR_ENABLE_UBI_CLAIM: z.string().default("true"),
  GOODDOLLAR_ENABLE_STREAMING: z.string().default("false"),
  GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER: z.string().optional(),
  GOODDOLLAR_FACETEC_PRODUCTION_KEY: z.string().optional(),
  GOODDOLLAR_GOODCOLLECTIVE_API_URL: z.string().url().optional(),
  GOODDOLLAR_REWARD_MULTIPLIER: z.string().default("1.0"),
});

export type GDollarEnvironment = z.infer<typeof gdollarEnvSchema>;

// Network configurations
export const NETWORK_CONFIGS = {
  celo: {
    chainId: 42220,
    name: "Celo Mainnet",
    rpcEndpoint: "https://forno.celo.org",
    explorerUrl: "https://celoscan.io",
    tokenAddress: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A", // G$ on Celo
    superTokenAddress: "0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f", // SuperGoodDollar on Celo
  },
  fuse: {
    chainId: 122,
    name: "Fuse Network",
    rpcEndpoint: "https://rpc.fuse.io",
    explorerUrl: "https://explorer.fuse.io",
    tokenAddress: "0x495d133B938596C9984d462F007B676bDc57eCEC", // G$ on Fuse
    superTokenAddress: "0x4fF2C33F4E529C6863639D5Fd9EB46C65f5a4c4f", // SuperGoodDollar on Fuse
  },
} as const;

export function validateGDollarConfig(runtime: IAgentRuntime): GDollarConfig {
  try {
    const env = {
      GOODDOLLAR_NETWORK: runtime.getSetting("GOODDOLLAR_NETWORK"),
      GOODDOLLAR_TOKEN_ADDRESS: runtime.getSetting("GOODDOLLAR_TOKEN_ADDRESS"),
      GOODDOLLAR_SUPER_TOKEN_ADDRESS: runtime.getSetting("GOODDOLLAR_SUPER_TOKEN_ADDRESS"),
      GOODDOLLAR_RPC_URL: runtime.getSetting("GOODDOLLAR_RPC_URL"),
      GOODDOLLAR_PRIVATE_KEY: runtime.getSetting("GOODDOLLAR_PRIVATE_KEY"),
      GOODDOLLAR_ENABLE_FACE_VERIFICATION: runtime.getSetting("GOODDOLLAR_ENABLE_FACE_VERIFICATION"),
      GOODDOLLAR_ENABLE_UBI_CLAIM: runtime.getSetting("GOODDOLLAR_ENABLE_UBI_CLAIM"),
      GOODDOLLAR_ENABLE_STREAMING: runtime.getSetting("GOODDOLLAR_ENABLE_STREAMING"),
      GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER: runtime.getSetting("GOODDOLLAR_FACETEC_DEVICE_KEY_IDENTIFIER"),
      GOODDOLLAR_FACETEC_PRODUCTION_KEY: runtime.getSetting("GOODDOLLAR_FACETEC_PRODUCTION_KEY"),
      GOODDOLLAR_GOODCOLLECTIVE_API_URL: runtime.getSetting("GOODDOLLAR_GOODCOLLECTIVE_API_URL"),
      GOODDOLLAR_REWARD_MULTIPLIER: runtime.getSetting("GOODDOLLAR_REWARD_MULTIPLIER"),
    } as GDollarEnvironment;

    const validatedEnv = gdollarEnvSchema.parse(env);
    const networkConfig = NETWORK_CONFIGS[validatedEnv.GOODDOLLAR_NETWORK];

    const config: GDollarConfig = {
      network: validatedEnv.GOODDOLLAR_NETWORK,
      tokenAddress: validatedEnv.GOODDOLLAR_TOKEN_ADDRESS || networkConfig.tokenAddress,
      superTokenAddress: validatedEnv.GOODDOLLAR_SUPER_TOKEN_ADDRESS || networkConfig.superTokenAddress,
      rpcEndpoint: validatedEnv.GOODDOLLAR_RPC_URL || networkConfig.rpcEndpoint,
      chainId: networkConfig.chainId,
      enableFaceVerification: validatedEnv.GOODDOLLAR_ENABLE_FACE_VERIFICATION === "true",
      enableUBIClaim: validatedEnv.GOODDOLLAR_ENABLE_UBI_CLAIM === "true",
      enableStreaming: validatedEnv.GOODDOLLAR_ENABLE_STREAMING === "true",
    };

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(
        `GoodDollar configuration validation failed:\n${errorMessages}`
      );
    }
    throw error;
  }
}

export function getDefaultGDollarConfig(network: "celo" | "fuse" = "fuse"): Partial<GDollarConfig> {
  const networkConfig = NETWORK_CONFIGS[network];
  
  return {
    network,
    tokenAddress: networkConfig.tokenAddress,
    superTokenAddress: networkConfig.superTokenAddress,
    rpcEndpoint: networkConfig.rpcEndpoint,
    chainId: networkConfig.chainId,
    enableFaceVerification: false,
    enableUBIClaim: true,
    enableStreaming: false,
  };
}