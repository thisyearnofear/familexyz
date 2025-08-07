import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    treeshake: false,
    minify: false,
    external: ["fsevents", "chokidar", "@elizaos/core", /node_modules/],
    platform: "node",
    bundle: false,
});
