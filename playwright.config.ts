import { defineConfig, devices } from "@playwright/test";

// E2E ต่อ dev server + DB dev จริง (สร้างใบทดสอบชื่อ "(e2e)" ใน DB) — รัน: npm run test:e2e
// ต้องมีผู้ใช้จาก `npm run db:seed:users` และตั้ง E2E_PASSWORD ให้ตรงกับ SEED_PASSWORD
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3778",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
    // flow สร้างใบใช้ wizard มือถือ — เดสก์ท็อปเทสเฉพาะ auth/รายการ/ภาพรวม
    { name: "desktop", testIgnore: /quotation-flow/, use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  // ตั้ง E2E_BASE_URL=http://localhost:3000 เพื่อใช้ dev server ที่เปิดอยู่แล้ว (Next 16 ไม่ให้เปิด dev ซ้อนใน dir เดียวกัน)
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npx next dev -p 3778",
        url: "http://localhost:3778/login",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
