// เลขที่ใบ QT-<ปี พ.ศ.>-<ลำดับ 4 หลัก> รันรายปี — pure (ตัวนับจริงอยู่ในตาราง quote_number_counters)
export function formatQuoteNumber(yearBE: number, seq: number): string {
  return `QT-${yearBE}-${String(seq).padStart(4, "0")}`;
}
