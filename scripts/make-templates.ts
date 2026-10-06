// สร้างไฟล์ Excel ที่ส่งให้ลูกค้ากรอก — รัน: npm run templates:make
// ออก 2 ไฟล์ใน docs/templates/
//   1. master-data-template.xlsx   สินค้า + ลูกค้าเก่า  (→ npm run db:import)
//   2. company-users-template.xlsx ข้อมูลบริษัท + พนักงาน (→ lib/constants/company.ts + scripts/seed-users.ts)
// แก้ที่นี่แล้วรันใหม่ได้เสมอ — ไฟล์ที่ลูกค้ากรอกแล้วเก็บไว้ที่ data/import/ (gitignored)
import { mkdirSync } from "node:fs";
import ExcelJS from "exceljs";

const OUT_DIR = "docs/templates";
const FONT = { name: "Tahoma", size: 11 } as const; // อ่านภาษาไทยได้ชัดทั้ง Excel/Numbers/Google Sheets
const INK = "FF3A2A1C";
const HEADER_BG = "FFF1ECE6";
const EXAMPLE_COLOR = "FF8A7F73";

type Col = { header: string; key: string; width: number; note?: string };

function styleHeader(row: ExcelJS.Row) {
  row.font = { ...FONT, bold: true, color: { argb: INK } };
  row.alignment = { vertical: "middle", wrapText: true };
  row.height = 28;
  row.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_BG } };
    c.border = { bottom: { style: "thin", color: { argb: "FFD6CEC4" } } };
  });
}

function addSheet(wb: ExcelJS.Workbook, name: string, cols: Col[]) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.columns = cols.map((c) => ({ header: c.header, key: c.key, width: c.width }));
  styleHeader(ws.getRow(1));
  return ws;
}

function addGuide(wb: ExcelJS.Workbook, title: string, lines: string[]) {
  const ws = wb.addWorksheet("คำแนะนำ", { views: [{ showGridLines: false }] });
  ws.getColumn(1).width = 110;
  ws.addRow([title]).font = { ...FONT, bold: true, size: 14, color: { argb: INK } };
  ws.addRow([]);
  for (const line of lines) {
    const r = ws.addRow([line]);
    r.font = { ...FONT, bold: line.startsWith("■") };
    r.alignment = { wrapText: true, vertical: "top" };
  }
  return ws;
}

// ---------- 1. สินค้า + ลูกค้าเก่า ----------
async function masterData() {
  const wb = new ExcelJS.Workbook();
  addGuide(wb, "ข้อมูลตั้งต้นของระบบใบเสนอราคา (สินค้า + ลูกค้าเก่า)", [
    "กรอกในแท็บ “สินค้า” และ “ลูกค้าเก่า” ด้านล่าง · ช่องที่มี * คือจำเป็นต้องกรอก",
    "แถวที่ขึ้นต้นด้วย (ตัวอย่าง) มีไว้ให้ดูรูปแบบ — ลบทิ้งก่อนส่งกลับได้เลย",
    "",
    "■ แท็บสินค้า",
    "• ชื่อสินค้า — ชื่อที่จะพิมพ์ลงใบเสนอราคา เช่น ข้าวหอมมะลิ 100%",
    "• ขนาดบรรจุ — รายละเอียดถุง/กระสอบ เช่น บรรจุถุง PP ขาวล้วน ติดแท็ก",
    "• น้ำหนักต่อถุง — ใส่เฉพาะตัวเลข หน่วยกิโลกรัม เช่น 45",
    "• ชื่อไฟล์รูป — ตั้งชื่อให้ตรงกับไฟล์รูปที่ส่งมา เช่น หอมมะลิ.jpg (ถ่ายด้วยมือถือได้ ไม่ต้องย่อ)",
    "",
    "■ แท็บลูกค้าเก่า",
    "• กรอกเฉพาะลูกค้าที่เคยซื้อ/เคยเสนอราคาแล้ว ลูกค้าใหม่เซลล์เพิ่มเองได้ในแอป",
    "• ที่อยู่แยกช่อง ตำบล/อำเภอ/จังหวัด — ไม่ต้องใส่คำว่า ต. อ. จ. ระบบเติมให้เอง",
    "• เบอร์โทร — ตัวเลขล้วน 9–10 หลัก ไม่ต้องใส่ขีด (ถ้ามีเบอร์ต่อ ใส่ในช่องหมายเหตุ)",
    "• ประเภทการชำระ — เลือกจากรายการ เครดิต หรือ เงินสด",
    "• จำนวนวันเครดิต — ใส่เมื่อเลือกเครดิต ปกติ 7–30 วัน",
    "",
    "ส่งกลับ: ไฟล์นี้ + โฟลเดอร์รูปสินค้า",
  ]);

  const p = addSheet(wb, "สินค้า", [
    { header: "ชื่อสินค้า *", key: "name", width: 34 },
    { header: "ขนาดบรรจุ", key: "spec", width: 32 },
    { header: "น้ำหนักต่อถุง (กก.) *", key: "weight", width: 20 },
    { header: "ลำดับแสดง", key: "sort", width: 12 },
    { header: "ชื่อไฟล์รูป", key: "image", width: 24 },
  ]);
  const pEx = p.addRow(["(ตัวอย่าง) ข้าวหอมมะลิ 100%", "บรรจุถุง PP ขาวล้วน ติดแท็ก", 45, 1, "หอมมะลิ.jpg"]);
  pEx.font = { ...FONT, italic: true, color: { argb: EXAMPLE_COLOR } };
  for (let r = 3; r <= 60; r++) {
    p.getCell(`C${r}`).dataValidation = { type: "decimal", operator: "greaterThan", formulae: [0], allowBlank: true, showErrorMessage: true, error: "ใส่เฉพาะตัวเลข เช่น 45" };
  }

  const c = addSheet(wb, "ลูกค้าเก่า", [
    { header: "ชื่อบริษัท *", key: "company", width: 38 },
    { header: "ที่อยู่ (บ้านเลขที่/ถนน) ", key: "addr", width: 34 },
    { header: "ตำบล/แขวง", key: "sub", width: 18 },
    { header: "อำเภอ/เขต", key: "dist", width: 18 },
    { header: "จังหวัด", key: "prov", width: 18 },
    { header: "รหัสไปรษณีย์", key: "post", width: 14 },
    { header: "เบอร์โทร", key: "phone", width: 16 },
    { header: "เลขผู้เสียภาษี (13 หลัก)", key: "tax", width: 22 },
    { header: "ประเภทการชำระ *", key: "pay", width: 18 },
    { header: "จำนวนวันเครดิต", key: "days", width: 16 },
    { header: "หมายเหตุ", key: "note", width: 24 },
  ]);
  const cEx = c.addRow(["(ตัวอย่าง) บจก. ทาโกฟู้ดส์อินดัสทรี", "99/12 ม.4 ถ.เทพารักษ์", "บางปลา", "บางพลี", "สมุทรปราการ", "10540", "021234567", "0105540001234", "เครดิต", 30, "ติดต่อคุณสมหญิง"]);
  cEx.font = { ...FONT, italic: true, color: { argb: EXAMPLE_COLOR } };
  for (let r = 3; r <= 200; r++) {
    c.getCell(`I${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"เครดิต,เงินสด"'], showErrorMessage: true, error: "เลือก เครดิต หรือ เงินสด" };
    c.getCell(`J${r}`).dataValidation = { type: "whole", operator: "between", formulae: [7, 30], allowBlank: true, showErrorMessage: true, error: "ปกติ 7–30 วัน" };
  }

  await wb.xlsx.writeFile(`${OUT_DIR}/master-data-template.xlsx`);
  console.log(`  ${OUT_DIR}/master-data-template.xlsx`);
}

// ---------- 2. ข้อมูลบริษัท + พนักงาน ----------
async function companyUsers() {
  const wb = new ExcelJS.Workbook();
  addGuide(wb, "ข้อมูลบริษัท + รายชื่อพนักงานที่ใช้งานระบบ", [
    "ไฟล์นี้ใช้ตั้งค่าระบบก่อนเปิดใช้งานจริง มี 2 แท็บ: “ข้อมูลบริษัท” และ “พนักงาน”",
    "",
    "■ แท็บข้อมูลบริษัท",
    "• ข้อมูลนี้จะพิมพ์อยู่บนหัวใบเสนอราคาทุกใบที่ส่งให้ลูกค้า — กรุณาตรวจตัวสะกดให้ถูกต้อง",
    "• กรอกในคอลัมน์ “กรอกตรงนี้” เท่านั้น คอลัมน์ตัวอย่างมีไว้ดูรูปแบบ",
    "",
    "■ แท็บพนักงาน",
    "• ใส่ทุกคนที่ต้องเข้าใช้ระบบ ทั้งเซลล์และผู้บริหาร",
    "• ชื่อผู้ใช้ (username) = ชื่อที่ใช้ตอนล็อกอิน · ใช้ได้เฉพาะ a-z, 0-9 และจุด เช่น somchai.s",
    "  (ห้ามภาษาไทย ห้ามเว้นวรรค ห้ามอักขระพิเศษ · ตั้งซ้ำกันไม่ได้)",
    "• สิทธิ์ เลือกได้ 2 แบบ",
    "    เซลล์      = สร้างใบเสนอราคาได้ เห็นเฉพาะใบของตัวเอง",
    "    ผู้บริหาร  = เห็นใบของทุกคน อนุมัติและเซ็นลายเซ็นได้",
    "• ไม่ต้องกรอกรหัสผ่าน — ระบบจะตั้งรหัสชั่วคราวให้ แล้วแจ้งให้แต่ละคนเปลี่ยนเองภายหลัง",
    "• ระบบไม่ส่งอีเมล จึงไม่ต้องใช้อีเมลของพนักงาน",
    "",
    "■ สิ่งที่ต้องส่งมาเพิ่มเติม",
    "• ไฟล์ลายเซ็นของผู้บริหารที่มีอำนาจอนุมัติ (ถ่ายรูป/สแกนบนกระดาษขาว พื้นหลังโล่ง)",
  ]);

  const info = wb.addWorksheet("ข้อมูลบริษัท", { views: [{ state: "frozen", ySplit: 1 }] });
  info.columns = [
    { header: "หัวข้อ", key: "label", width: 36 },
    { header: "กรอกตรงนี้", key: "value", width: 52 },
    { header: "ตัวอย่าง / คำอธิบาย", key: "hint", width: 56 },
  ];
  styleHeader(info.getRow(1));
  const fields: [string, string][] = [
    ["ชื่อบริษัท (ภาษาไทย) *", "บริษัท ออร์แกนิค เพาเวอร์ 2020 จำกัด"],
    ["ชื่อบริษัท (ภาษาอังกฤษ) *", "ORGANIC POWER 2020 CO.,LTD"],
    ["ที่อยู่บริษัท (บรรทัดเดียว) *", "43/38 ม.1 ต.ขุนแก้ว อ.นครชัยศรี จ.นครปฐม 73120"],
    ["เบอร์โทรศัพท์ *", "034-123-456 (ใส่ขีดได้ ข้อมูลนี้แสดงบนเอกสาร)"],
    ["เลขประจำตัวผู้เสียภาษี (13 หลัก) *", "0735563000123"],
    ["ชื่อ-นามสกุล ผู้มีอำนาจเซ็นอนุมัติ *", "ชื่อที่จะพิมพ์ใต้ลายเซ็นในใบเสนอราคา"],
    ["ตำแหน่งของผู้เซ็น *", "เช่น ผู้จัดการฝ่ายขาย / กรรมการผู้จัดการ"],
    ["อีเมลกลางของบริษัท *", "ใช้สมัครบริการที่ระบบต้องใช้ (ไม่ใช่อีเมลส่วนตัวพนักงาน)"],
    ["เว็บไซต์ (ถ้ามี)", "www.example.co.th"],
    ["ข้อความแนะนำบริษัท (ย่อหน้าเปิดใบเสนอราคา)", "ถ้าไม่กรอก ระบบจะใช้ข้อความมาตรฐานที่เตรียมไว้ให้"],
  ];
  for (const [label, hint] of fields) {
    const row = info.addRow([label, "", hint]);
    row.font = FONT;
    row.alignment = { vertical: "top", wrapText: true };
    row.getCell(1).font = { ...FONT, bold: true, color: { argb: INK } };
    row.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFDF8" } };
    row.getCell(2).border = { bottom: { style: "thin", color: { argb: "FFD6CEC4" } } };
    row.getCell(3).font = { ...FONT, italic: true, color: { argb: EXAMPLE_COLOR } };
  }

  const staff = addSheet(wb, "พนักงาน", [
    { header: "ชื่อ-นามสกุล *", key: "name", width: 30 },
    { header: "ชื่อผู้ใช้ (username) *", key: "username", width: 24 },
    { header: "สิทธิ์ *", key: "role", width: 16 },
    { header: "เบอร์โทร", key: "phone", width: 16 },
    { header: "หมายเหตุ", key: "note", width: 30 },
  ]);
  for (const r of [
    ["(ตัวอย่าง) สมชาย สุขใจ", "somchai.s", "เซลล์", "0812345678", ""],
    ["(ตัวอย่าง) พีรวิชญ์ วิชัยดิษฐ", "peerawit", "ผู้บริหาร", "", "เป็นผู้เซ็นอนุมัติ"],
  ]) {
    staff.addRow(r).font = { ...FONT, italic: true, color: { argb: EXAMPLE_COLOR } };
  }
  for (let r = 4; r <= 60; r++) {
    staff.getCell(`C${r}`).dataValidation = { type: "list", allowBlank: true, formulae: ['"เซลล์,ผู้บริหาร"'], showErrorMessage: true, error: "เลือก เซลล์ หรือ ผู้บริหาร" };
  }

  await wb.xlsx.writeFile(`${OUT_DIR}/company-users-template.xlsx`);
  console.log(`  ${OUT_DIR}/company-users-template.xlsx`);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  console.log("สร้างไฟล์ template:");
  await masterData();
  await companyUsers();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
