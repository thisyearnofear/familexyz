import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  sourcemap: true,
  clean: true,
  format: ["esm"],
  platform: "node",
  target: "node18",
  bundle: false,
  dts: true,
  external: [
    "dotenv",
    "fs",
    "path",
    "@reflink/reflink",
    "@node-rs/crc32",
    "nodejs-polars",
    "duckdb",
    "fsevents",
    "chokidar",
    "@elizaos/core",
  ],
  esbuildOptions(options) {
    // Ignore .node files completely
    options.ignoreAnnotations = true;
  }
});