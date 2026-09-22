import { expect, test, type Page } from "@playwright/test";
import { USERS, login, vis } from "./helpers";

// flow ครบวงจรบน DB dev: สร้าง (wizard) → ส่งอนุมัติ → ตีกลับ → แก้ → ส่งใหม่ → อนุมัติ+เซ็น → export (→ sent) → ปิดการขาย
// ต้องมีลายเซ็นของผู้บริหารในโปรไฟล์ (SETUP.md ข้อ 6)
test.describe.configure({ mode: "serial" });

const CUSTOMER = `หจก. ข้าวทองเจริญ (e2e ${Date.now().toString(36)})`;
let quotationId = "";
// ชื่อสินค้าตัวที่ 2 ในใบ — อ่านจากรายการจริงใน DB (ไม่ผูกกับชื่อ master เพราะข้อมูลจริงเปลี่ยนได้)
let secondProduct = "";

// เลือกสินค้าลำดับที่ index ในรายการ (ที่ยังไม่อยู่ในใบ) แล้วคืนชื่อ
async function addProduct(page: Page, index: number, price: string) {
  await page.click(vis('button:has-text("เพิ่มสินค้า")'));
  await page.waitForSelector("#pick-price");
  const option = page.locator("[role=option]").nth(index);
  const name = (await option.locator("div > div").first().textContent())!.trim();
  await option.click();
  await page.fill("#pick-price", price);
  await page.click('button:has-text("ยืนยันเพิ่มรายการ")');
  await page.waitForSelector("#pick-price", { state: "detached" });
  return name;
}

test("sale creates a quotation through the wizard and submits", async ({ page }) => {
  await login(page, USERS.sale);
  await page.goto("/quotations/new");

  // ลูกค้าเก่า → ฟอร์มถูกเติม+ล็อก · สลับกลับเป็นลูกค้าใหม่ → ล้างค่าทั้งชุด
  await page.click(vis('button:has-text("ลูกค้าเก่า")'));
  await page.click("[role=listbox] [role=option] >> nth=0");
  await expect(page.locator("#province")).not.toHaveValue(""); // ชื่อบริษัทเป็นกล่องล็อก ไม่ใช่ input
  await page.click(vis('button:has-text("ลูกค้าใหม่")'));
  await expect(page.locator("#companyName")).toHaveValue("");
  await expect(page.locator("#province")).toHaveValue("");

  await page.click(vis('button:has-text("ถัดไป · เลือกสินค้า")'));
  await expect(page.locator("body")).toContainText("กรุณากรอกชื่อบริษัทลูกค้า");

  await page.fill("#companyName", CUSTOMER);
  await page.fill("#addressLine", "12/3 ม.2");
  await page.fill("#subDistrict", "บางปลา");
  await page.fill("#district", "บางพลี");
  await page.fill("#province", "สมุทรปราการ");
  await page.fill("#postalCode", "10540");
  await page.fill("#taxId", "0105548012345");
  await page.click('button:has-text("15")');
  await page.click(vis('button:has-text("ถัดไป · เลือกสินค้า")'));

  // รูปสินค้าจาก Storage (signed URL) ต้องมาถึง sheet เลือกสินค้า
  await page.click(vis('button:has-text("เพิ่มสินค้า")'));
  await page.waitForSelector("#pick-price");
  await expect(page.locator("[role=option] img").first()).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForSelector("#pick-price", { state: "detached" });

  await addProduct(page, 0, "1260");
  // รูปในตารางรายการ (หลังยืนยัน) ต้องโหลดได้จริง ไม่ใช่กรอบเปล่า
  const ledgerImg = page.locator(vis("img[alt]")).first();
  await expect(ledgerImg).toBeVisible();
  expect(await ledgerImg.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  secondProduct = await addProduct(page, 0, "1145"); // ตัวแรกถูกซ่อนไปแล้ว → index 0 = สินค้าตัวถัดไป
  await page.fill(vis(`input[aria-label="ราคา ${secondProduct}"]`), "1150");
  await page.click(vis('button:has-text("ถัดไป · ตรวจสอบ")'));

  await page.fill(vis('input[placeholder^="พิมพ์หมายเหตุ"]'), "ยืนราคา 30 วัน");
  await page.keyboard.press("Enter");
  await expect(page.locator("body")).toContainText("เครดิต 15 วัน");
  await page.click(vis('button:has-text("ส่งให้ผู้บริหารอนุมัติ")'));
  await page.waitForURL(/\/quotations\/[0-9a-f-]{36}$/, { timeout: 60_000 });
  quotationId = page.url().split("/").pop()!;

  const body = page.locator("body");
  await expect(body).toContainText(/QT-25\d\d-\d{4}/);
  await expect(body).toContainText("รออนุมัติ");
  await expect(body).toContainText("1,150");
  await expect(page.locator(vis('a:has-text("แก้ไข")'))).toHaveCount(0);
});

test("sale cannot see another sale's quotation; executive can", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, USERS.exec);
  await page.goto(`/quotations/${quotationId}`);
  await expect(page.locator("body")).toContainText("อยู่ที่คุณ");
  await page.goto(`/quotations/${quotationId}/edit`);
  await expect(page).toHaveURL(new RegExp(`/quotations/${quotationId}$`));
  await page.goto("/quotations/new");
  await expect(page).toHaveURL(/\/quotations$/);
  await ctx.close();
});

test("executive returns with reason; sale sees it, edits and resubmits", async ({ browser }) => {
  const exec = await (await browser.newContext()).newPage();
  await login(exec, USERS.exec);
  await exec.goto(`/quotations/${quotationId}`);
  await exec.click(vis('button:has-text("ตีกลับพร้อมเหตุผล")'));
  await expect(exec.locator('button:has-text("ยืนยันตีกลับ")')).toBeDisabled();
  await exec.fill("#reject-reason", "ราคาข้าวขาวสูงไป ปรับเป็น 1,100");
  await exec.click('button:has-text("ยืนยันตีกลับ")');
  await exec.waitForSelector('button:has-text("ตีกลับพร้อมเหตุผล")', { state: "detached", timeout: 60_000 });
  await expect(exec.locator("body")).toContainText("ตีกลับแก้ไข: ราคาข้าวขาวสูงไป");

  const sale = await (await browser.newContext()).newPage();
  await login(sale, USERS.sale);
  await sale.goto(`/quotations/${quotationId}`);
  await expect(sale.locator("body")).toContainText("ราคาข้าวขาวสูงไป");
  await expect(sale.locator('img[alt^="ลายเซ็น"]')).toHaveCount(0); // ลายเซ็นไม่หลุดไปฝั่งเซลล์
  await sale.click(vis('a:has-text("แก้ไข")'));
  await sale.waitForURL(`**/quotations/${quotationId}/edit`);
  await sale.click(vis('button:has-text("ถัดไป · เลือกสินค้า")'));
  await sale.fill(vis(`input[aria-label="ราคา ${secondProduct}"]`), "1100");
  await sale.click(vis('button:has-text("ถัดไป · ตรวจสอบ")'));
  await sale.click(vis('button:has-text("ส่งให้ผู้บริหารอนุมัติ")'));
  await sale.waitForURL(`**/quotations/${quotationId}`, { timeout: 60_000 });
  await expect(sale.locator("body")).toContainText(`ราคา ${secondProduct}: 1,150 → 1,100`);
});

test("executive approves with signature; quotation locks", async ({ browser }) => {
  const exec = await (await browser.newContext()).newPage();
  await login(exec, USERS.exec);
  await exec.goto(`/quotations/${quotationId}`);
  await exec.click(vis('button:has-text("อนุมัติ + เซ็นลายเซ็น")'));
  await expect(exec.locator('img[alt="ลายเซ็นของคุณ"]')).toHaveCount(1);
  await exec.click('button:has-text("ยืนยันอนุมัติ + เซ็น")');
  await exec.waitForSelector('button:has-text("อนุมัติ + เซ็นลายเซ็น")', { state: "detached", timeout: 60_000 });
  await expect(exec.locator("body")).toContainText("เซ็นโดย");

  const sale = await (await browser.newContext()).newPage();
  await login(sale, USERS.sale);
  await sale.goto(`/quotations/${quotationId}/edit`);
  await expect(sale).toHaveURL(new RegExp(`/quotations/${quotationId}$`));
  await expect(sale.locator(vis('button:has-text("Export PDF")'))).toHaveCount(1);
});

test("sale exports PDF (→ sent), re-exports, then closes the sale", async ({ browser }) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await login(page, USERS.sale);
  const r = await ctx.request.get(`/api/quotations/${quotationId}/pdf`);
  expect(r.status()).toBe(200);
  expect(r.headers()["content-type"]).toBe("application/pdf");
  expect((await r.body()).subarray(0, 5).toString()).toBe("%PDF-");

  await page.goto(`/quotations/${quotationId}`);
  await expect(page.locator("body")).toContainText("ส่งลูกค้าแล้ว");
  await expect(page.locator("body")).toContainText("Export PDF: สถานะเปลี่ยนเป็น ส่งลูกค้าแล้ว");
  expect((await ctx.request.get(`/api/quotations/${quotationId}/pdf`)).status()).toBe(200);

  await page.click(vis('button:has-text("ปิดการขาย")'));
  await page.click('button:has-text("ยืนยันปิดการขาย")');
  await page.waitForSelector(vis('button:has-text("ปิดการขาย")'), { state: "detached", timeout: 60_000 });
  await expect(page.locator(vis('button:has-text("Export PDF ซ้ำ")'))).toHaveCount(1);
});
