import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/react.ts"
  ],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  target: "es2022",
  platform: "neutral",
  external: [
    "react",
    "react-dom",
    "@hashgraph/sdk",
    "hashconnect",
    "@elizaos/core",
    "@elizaos/hedera-core"
  ],
  esbuildOptions(options) {
    options.conditions = ["module"];
  },
});
