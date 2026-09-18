import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "**/*.db.test.ts"], // db test แยกรันด้วย test:db
    setupFiles: ["./tests/setup.ts"],
    coverage: { provider: "v8", include: ["lib/**"] },
  },
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "tests/serverOnlyStub.ts") } },
});
