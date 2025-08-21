import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    sourcemap: true,
    clean: true,
    format: ["esm"], // Ensure you're targeting CommonJS
    platform: "node",
    target: "node18",
    bundle: false, // Don't bundle for library
    splitting: false,
    dts: false, // Disable declaration files for simple build
    external: [
        "dotenv",
        "fs",
        "path",
        "http",
        "https",
        "onnxruntime-node",
        "sharp",
        "@huggingface/transformers",
        "bignumber.js",
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
