import { expect, test } from "@playwright/test";
import { USERS, login, logout } from "./helpers";

test.describe("auth", () => {
  test("unauthenticated is redirected to /login; API returns 401", async ({ page, request }) => {
    await page.goto("/quotations");
    await expect(page).toHaveURL(/\/login$/);
    const r = await request.get("/api/quotations/00000000-0000-4000-8000-000000000000/pdf", { maxRedirects: 0 });
    expect(r.status()).toBe(401);
  });

  test("wrong password shows Thai error and keeps username", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#username", USERS.sale);
    await page.fill("#password", "wrong-password");
    await page.click("button[type=submit]");
    await expect(page.locator("p[role=alert]")).toContainText("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
    await expect(page.locator("#username")).toHaveValue(USERS.sale);
  });

  test("sale logs in, sees own scope, logs out", async ({ page }) => {
    await login(page, USERS.sale);
    await expect(page.locator("body")).toContainText("ใบเสนอราคาของฉัน");
    await page.goto("/login");
    await expect(page).toHaveURL(/\/quotations$/); // logged in → bounced back
    await logout(page);
    await page.goto("/quotations");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("executive login (username normalized) sees all + owner column", async ({ page }) => {
    await login(page, USERS.exec.toUpperCase());
    await expect(page.locator("body")).toContainText("ทุกเซลล์");
  });
});
