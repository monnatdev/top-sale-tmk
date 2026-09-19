import { expect, type Page } from "@playwright/test";

export const USERS = {
  sale: process.env.E2E_SALE ?? "somchai.s",
  exec: process.env.E2E_EXEC ?? "wirat",
  password: process.env.E2E_PASSWORD ?? "TopSale2569!",
};

export async function login(page: Page, username: string) {
  await page.goto("/login");
  await page.fill("#username", username);
  await page.fill("#password", USERS.password);
  await page.click("button[type=submit]");
  await page.waitForURL("**/quotations", { timeout: 60_000 });
  await page.waitForLoadState("networkidle");
}

export async function logout(page: Page) {
  await page.goto("/settings");
  await page.click('button:has-text("ออกจากระบบ")');
  await page.waitForURL("**/login");
}

// QuotationForm render section ซ้ำ (มือถือ/เดสก์ท็อป) → selector ต้องเป็น :visible เสมอ
export const vis = (selector: string) => `${selector}:visible`;

export async function expectBodyContains(page: Page, ...texts: string[]) {
  const body = page.locator("body");
  for (const t of texts) await expect(body).toContainText(t);
}
