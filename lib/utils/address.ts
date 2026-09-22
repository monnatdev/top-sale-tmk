export type ThaiAddressParts = {
  addressLine: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
};

export const BANGKOK = "กรุงเทพมหานคร";

// กรุงเทพฯ ใช้ แขวง/เขต และไม่มีคำนำหน้าจังหวัด — ต่างจังหวัดใช้ ต./อ./จ.
export function isBangkok(province: string) {
  return /กรุงเทพ/.test(province);
}

// ประกอบที่อยู่ 1 บรรทัดสำหรับ PDF/หน้าสรุป — ข้ามช่องที่ว่าง ไม่เหลือคำนำหน้าลอยๆ
export function formatThaiAddress(a: ThaiAddressParts): string {
  const bkk = isBangkok(a.province);
  return [
    a.addressLine,
    a.subDistrict && `${bkk ? "แขวง" : "ต."}${a.subDistrict}`,
    a.district && `${bkk ? "เขต" : "อ."}${a.district}`,
    a.province && (bkk ? a.province : `จ.${a.province}`),
    a.postalCode,
  ]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(" ");
}

// ตัดคำนำหน้าที่ผู้ใช้พิมพ์ติดมา (ตำบล/ต./แขวง, อำเภอ/อ./เขต, จังหวัด/จ.) เก็บใน DB เป็นชื่อล้วน — ใช้ตอน import
const SUB_DISTRICT_PREFIX = /^(ตำบล|ต\.|แขวง)\s*/;
const DISTRICT_PREFIX = /^(อำเภอ|อ\.|เขต)\s*/;
const PROVINCE_PREFIX = /^(จังหวัด|จ\.)\s*/;

export function normalizeAddressParts(a: ThaiAddressParts): ThaiAddressParts {
  const clean = (s: string) => s.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  let province = clean(a.province).replace(PROVINCE_PREFIX, "");
  if (isBangkok(province)) province = BANGKOK;
  return {
    addressLine: clean(a.addressLine),
    subDistrict: clean(a.subDistrict).replace(SUB_DISTRICT_PREFIX, ""),
    district: clean(a.district).replace(DISTRICT_PREFIX, ""),
    province,
    postalCode: clean(a.postalCode),
  };
}
