import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  outDir: "dist",
  sourcemap: true,
  clean: true,
  format: ["esm"],
  platform: "node",
  bundle: false,
  external: [
    "dotenv",
    "fs",
    "path",
    "@reflink/reflink",
    "@node-rs/crc32",
    "nodejs-polars",
    "duckdb",
    "fsevents",
  ],
});