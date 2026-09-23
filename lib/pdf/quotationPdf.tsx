/* eslint-disable jsx-a11y/alt-text -- <Image> ของ react-pdf ไม่ใช่ <img> DOM */
// template PDF ใบเสนอราคา (A4 หน้าเดียว) ตาม pattern ใบเดิมของบริษัท — ดูดีไซน์ส่วน "PDF PREVIEW"
// pure: รับข้อมูลที่ format แล้ว ไม่แตะ DB/Next · เรียกจาก service เท่านั้น
import fs from "node:fs";
import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { TextProps } from "@react-pdf/renderer";
import type { ImageBytes } from "@/lib/storage/download";
import { formatThaiAddress } from "@/lib/utils/address";

export type QuotationPdfData = {
  quoteNumber: string;
  /** วันที่ format แล้ว "20/07/2569" */
  quoteDate: string;
  paymentType: "credit" | "cash";
  creditDays: number;
  customer: { name: string; addressLine: string; subDistrict: string; district: string; province: string; postalCode: string };
  items: { name: string; spec: string; weightKg: string; price: string; image: ImageBytes | null }[];
  notes: string[];
  signer: { name: string; title: string } | null;
  signature: ImageBytes | null;
  company: { nameTh: string; nameEn: string; address: string; phone: string; taxId: string; brand: string; intro: string };
};

// ---------- fonts (ฝังจากไฟล์ในโปรเจกต์ — next.config outputFileTracingIncludes รวมไฟล์นี้ตอน deploy) ----------
const FONT_DIR = path.join(process.cwd(), "lib/pdf/fonts");
Font.register({
  family: "PlexThai",
  fonts: [
    { src: path.join(FONT_DIR, "IBMPlexSansThai-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "IBMPlexSansThai-Medium.ttf"), fontWeight: 500 },
    { src: path.join(FONT_DIR, "IBMPlexSansThai-SemiBold.ttf"), fontWeight: 600 },
  ],
});
Font.register({
  family: "PlexMono",
  fonts: [
    { src: path.join(FONT_DIR, "IBMPlexMono-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "IBMPlexMono-Medium.ttf"), fontWeight: 500 },
  ],
});
// ไม่ตัดคำไทยด้วย hyphen
Font.registerHyphenationCallback((word) => [word]);

// ---------- โลโก้แบรนด์ (ไฟล์เดียวกับที่เว็บใช้) ----------
// อ่านครั้งเดียวตอนโหลดโมดูล · ไม่มีไฟล์ = ยังออก PDF ได้ แค่ไม่มีโลโก้ (next.config trace ไฟล์นี้เข้า bundle)
const LOGO: ImageBytes | null = (() => {
  try {
    return { data: fs.readFileSync(path.join(process.cwd(), "public/brand/logo.png")), format: "png" };
  } catch (e) {
    console.error("[pdf] อ่านโลโก้ไม่ได้", e);
    return null;
  }
})();

// react-pdf normalize "ำ" → "ํ"+"า" แต่ยังนับความยาวเดิม → ตัวท้ายของบรรทัดหาย (github.com/diegomura/react-pdf/issues/3295)
// decompose เองก่อนทุก string ไทย — ทุกข้อความใน template ต้องผ่าน <T> ไม่ใช้ <Text> ตรงๆ
const fixThai = (s: string) => s.replace(/\u0E33/g, "\u0E4D\u0E32");
const fixChildren = (children: React.ReactNode): React.ReactNode =>
  Array.isArray(children) ? children.map(fixChildren) : typeof children === "string" ? fixThai(children) : children;

type TProps = React.PropsWithChildren<TextProps>;
function T({ children, ...props }: TProps) {
  return <Text {...props}>{fixChildren(children)}</Text>;
}
// Plex Mono ไม่มี glyph ไทย — ใช้กับตัวเลข/ละตินเท่านั้น
function M({ children, style, ...props }: TProps) {
  const styles = Array.isArray(style) ? style : style ? [style] : [];
  return (
    <Text {...props} style={[s.mono, ...styles]}>
      {children}
    </Text>
  );
}

// สีจาก design token (PDF ไม่มี CSS variable — hex ชุดเดียวกับ globals.css)
const C = { ink: "#3a2a1c", muted: "#8a7f73", border: "#e7e1da", strong: "#d6cec4", surface: "#f1ece6", canvas: "#ede8e2", primary: "#e8842b" };

const s = StyleSheet.create({
  page: { fontFamily: "PlexThai", fontSize: 11, color: C.ink, paddingTop: 40, paddingBottom: 40, paddingHorizontal: 44, lineHeight: 1.5 },
  mono: { fontFamily: "PlexMono" },
  muted: { color: C.muted },
  header: { flexDirection: "row", gap: 12, borderBottomWidth: 2, borderBottomColor: C.ink, paddingBottom: 12 },
  logo: { width: 38, height: 58, objectFit: "contain" },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16 },
  table: { borderWidth: 1, borderColor: C.ink, marginTop: 14 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, alignItems: "center" },
  th: { backgroundColor: C.surface, borderBottomColor: C.ink, fontWeight: 600, fontSize: 10.5 },
  cell: { paddingVertical: 7, paddingHorizontal: 6, borderRightWidth: 1, borderRightColor: C.canvas },
  cNo: { width: 32, textAlign: "center" },
  cName: { flex: 1, paddingHorizontal: 9 },
  cKg: { width: 72, textAlign: "center" },
  cImg: { width: 88, alignItems: "center" },
  cPrice: { width: 92, textAlign: "right", borderRightWidth: 0 },
  imgBox: { width: 62, height: 46, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  notes: { marginTop: 14, fontSize: 10.5, lineHeight: 1.7 },
  sign: { flexDirection: "row", gap: 36, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: C.strong, borderTopStyle: "dotted", fontSize: 10.5 },
  signLine: { height: 76, borderBottomWidth: 1, borderBottomColor: C.ink, justifyContent: "flex-end", alignItems: "flex-end" },
});

function QuotationPdf({ d }: { d: QuotationPdfData }) {
  const addr = formatThaiAddress(d.customer);
  return (
    <Document title={`ใบเสนอราคา ${d.quoteNumber}`} author={d.company.nameTh} language="th">
      <Page size="A4" style={s.page}>
        {/* หัวบริษัท */}
        <View style={s.header}>
          {LOGO ? <Image src={LOGO} style={s.logo} /> : null}
          <View style={{ flex: 1 }}>
            <T style={{ fontSize: 13, fontWeight: 600 }}>{d.company.nameTh}</T>
            <M style={[s.muted, { fontSize: 9, letterSpacing: 0.5 }]}>{d.company.nameEn}</M>
            <T style={{ fontSize: 10.5, marginTop: 2 }}>{d.company.address}</T>
            <T style={[s.muted, { fontSize: 9.5 }]}>
              โทร <M>{d.company.phone}</M> · เลขผู้เสียภาษี <M>{d.company.taxId}</M>
            </T>
          </View>
        </View>

        {/* ชื่อเอกสาร + เลขที่ */}
        <View style={s.titleRow}>
          <View>
            <T style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.25 }}>ใบเสนอราคา</T>
            <M style={[s.muted, { fontSize: 9, letterSpacing: 1.5, marginTop: 2 }]}>QUOTATION</M>
          </View>
          <View style={{ alignItems: "flex-end", fontSize: 10.5 }}>
            <T>
              เลขที่ <M>{d.quoteNumber}</M>
            </T>
            <T>
              วันที่ <M>{d.quoteDate}</M>
            </T>
            <T style={s.muted}>{d.paymentType === "credit" ? `เครดิต ${d.creditDays} วัน` : "เงินสด"}</T>
          </View>
        </View>

        {/* เรียน + ย่อหน้าเปิด */}
        <View style={{ marginTop: 14, fontSize: 11 }}>
          <T>
            <T style={{ fontWeight: 600 }}>เรียน</T> {d.customer.name}
            {addr ? ` · ${addr}` : ""}
          </T>
          <T style={{ marginTop: 5 }}>
            {d.company.nameTh} {d.company.intro}
          </T>
        </View>

        {/* ตารางราคาต่อถุง */}
        <View style={s.table}>
          <View style={[s.tr, s.th]}>
            <T style={[s.cell, s.cNo]}>ที่</T>
            <T style={[s.cell, s.cName]}>รายการ</T>
            <T style={[s.cell, s.cKg]}>นน./ถุง</T>
            <T style={[s.cell, s.cImg, { textAlign: "center" }]}>ภาพสินค้า</T>
            <T style={[s.cell, s.cPrice, { textAlign: "center" }]}>ราคาส่ง/ถุง</T>
          </View>
          {d.items.map((it, i) => (
            <View key={i} style={[s.tr, i === d.items.length - 1 ? { borderBottomWidth: 0 } : {}]} wrap={false}>
              <M style={[s.cell, s.cNo]}>{i + 1}</M>
              <View style={[s.cell, s.cName]}>
                <T style={{ fontWeight: 600 }}>{it.name}</T>
                {it.spec ? <T style={[s.muted, { fontSize: 10 }]}>{it.spec}</T> : null}
              </View>
              <T style={[s.cell, s.cKg]}>
                <M>{it.weightKg}</M> กก.
              </T>
              <View style={[s.cell, s.cImg]}>
                {it.image ? <Image src={it.image} style={[s.imgBox, { objectFit: "cover" }]} /> : <View style={s.imgBox} />}
              </View>
              <M style={[s.cell, s.cPrice, { fontSize: 13 }]}>{it.price}</M>
            </View>
          ))}
        </View>

        {/* หมายเหตุ */}
        {d.notes.length > 0 ? (
          <View style={s.notes}>
            <T style={{ fontWeight: 600, marginBottom: 2 }}>หมายเหตุ / เงื่อนไขการสั่งซื้อ</T>
            {d.notes.map((n, i) => (
              <T key={i}>
                {i + 1}. {n}
              </T>
            ))}
          </View>
        ) : null}

        {/* ลงชื่อ */}
        <View style={s.sign} wrap={false}>
          <View style={{ flex: 1 }}>
            <T style={s.muted}>ลูกค้า</T>
            <View style={s.signLine} />
            <T style={[s.muted, { marginTop: 4 }]}>ลงชื่อ / วันที่</T>
          </View>
          <View style={{ flex: 1, alignItems: "flex-end" }}>
            <T>ขอแสดงความนับถือ</T>
            <View style={[s.signLine, { alignSelf: "stretch" }]}>{d.signature ? <Image src={d.signature} style={{ width: 200, height: 70, objectFit: "contain", objectPositionX: "100%" }} /> : null}</View>
            <T style={[s.muted, { marginTop: 4 }]}>{d.signer ? `${d.signer.name} · ${d.signer.title}` : "—"}</T>
          </View>
        </View>

        <T fixed style={[s.muted, { position: "absolute", bottom: 20, left: 44, right: 44, fontSize: 8, textAlign: "right" }]} render={({ pageNumber, totalPages }) => `${d.quoteNumber} · หน้า ${pageNumber}/${totalPages}`} />
      </Page>
    </Document>
  );
}

export async function renderQuotationPdf(data: QuotationPdfData): Promise<Buffer> {
  return renderToBuffer(<QuotationPdf d={data} />);
}
