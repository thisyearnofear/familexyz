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
    "@gooddollar/goodlogin-sdk",
    "@elizaos/core",
  ],
  esbuildOptions(options) {
    // Ensure esbuild doesn't try to bundle fsevents or native .node files
    options.ignoreAnnotations = true;
    options.loader = {
      ...(options.loader || {}),
      ".node": "file",
    };
    options.plugins = [
      ...(options.plugins || []),
      {
        name: "externalize-fsevents",
        setup(build) {
          build.onResolve({ filter: /^fsevents(\/.*)?$/ }, (args) => {
            return { path: args.path, external: true };
          });
          build.onResolve({ filter: /\.node$/ }, (args) => {
            return { path: args.path, external: true };
          });
        },
      },
    ];
  }
});