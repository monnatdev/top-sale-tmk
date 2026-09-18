import { defineConfig } from "vitest/config";
import path from "node:path";

// เทสที่ต่อ DB จริง (*.db.test.ts) — รันแยก: npm run test:db · ใช้ DB จาก .env.local (dev) ห้ามชี้ prod
export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.db.test.ts"],
    exclude: ["node_modules", ".next"],
    setupFiles: ["./tests/db/setup.ts"],
    fileParallelism: false, // เทสแชร์ DB — รันทีละไฟล์กันชนกัน
    testTimeout: 30000,
    hookTimeout: 60000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "."), "server-only": path.resolve(__dirname, "tests/serverOnlyStub.ts") } },
});
