import { expect, test } from "@playwright/test";
import { USERS, login, vis } from "./helpers";

test.describe("list + dashboard", () => {
  test("filter chips, search form, sort, invalid params", async ({ page }) => {
    await login(page, USERS.sale);
    await page.click(vis('a:has-text("ปิดการขาย")'));
    await expect(page).toHaveURL(/status=won/);
    await page.goto("/quotations?q=ไม่มีแน่นอนxyz");
    await expect(page.locator("body")).toContainText("ไม่พบใบเสนอราคาตามเงื่อนไข");
    await page.goto("/quotations?status=bogus&page=abc&sort=zzz");
    await expect(page.locator("body")).toContainText("ใบเสนอราคา");
    await page.goto("/quotations");
    await page.fill(vis('input[name="q"]'), "QT-25");
    await page.press(vis('input[name="q"]'), "Enter");
    await expect(page).toHaveURL(/q=QT-25/);
    await expect(page.locator("body")).toContainText("ผลค้นหา");
    await page.selectOption("select", "customer");
    await expect(page).toHaveURL(/sort=customer/);
  });

  test("dashboard counts link to filtered list", async ({ page }) => {
    await login(page, USERS.exec);
    await page.click(vis('a:has-text("ภาพรวม")'));
    await page.waitForURL("**/dashboard");
    await expect(page.locator("body")).toContainText("ใบเสนอราคาแยกตามสถานะ");
    await page.locator('a[href="/quotations?status=won"]').first().click();
    await expect(page).toHaveURL(/status=won/);
  });
});
