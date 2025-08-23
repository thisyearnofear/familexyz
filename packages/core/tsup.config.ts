import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"], // Ensure you're targeting CommonJS
    platform: "node",
    target: "node18",
    bundle: true, // Bundle all internal modules so runtime has a single file
    splitting: false,
    dts: false,
    noExternal: ["bignumber.js"],
    external: [
        "dotenv",
        "fs",
        "path",
        "http",
        "https",
        "onnxruntime-node",
        "sharp",
        "@huggingface/transformers",

        "fsevents",
        // Add all the packages that are causing issues
        "aws-lambda",
        "better-sqlite3",
        "body-parser",
        "chrome",
        "cors",
        "lodash",
        "node-fetch",
        "nodemailer",
        "pdfjs-dist",
        "pg",
        "react",
        "react-dom",
    ],
});
