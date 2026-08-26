import path from "node:path";

import { defineConfig } from "vitest/config";

// Tests run against pure feature logic in Node. The alias mirrors Next.js so
// colocated tests use the same imports as production code.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
