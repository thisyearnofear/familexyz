import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  outDir: "dist",
  target: "node16",
  external: ["@hashgraph/sdk", "@elizaos/core", "node-cache", "bs58"],
  noExternal: [],
  platform: "node",
  bundle: false,
});
