import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "server-only": path.resolve(import.meta.dirname, "tests/helpers/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/remote/**/*.remote.test.ts"],
    env: loadEnv("development", process.cwd(), ""),
    testTimeout: 180_000,
    hookTimeout: 120_000,
  },
});
