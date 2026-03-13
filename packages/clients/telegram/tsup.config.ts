import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"],
    external: [
        "dotenv",
        "fs",
        "path",
        "https",
        "http",
        "agentkeepalive",
        // Add other modules you want to externalize
    ],
});
