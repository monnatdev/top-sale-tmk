// อักษรย่อสำหรับ avatar: อักษรแรกของ 2 คำแรก (ข้ามสระนำ เ แ โ ใ ไ) เช่น "สมชาย ส." → "สส", "วิรัช เจริญพร" → "วจ"
const LEADING_VOWELS = /^[เแโใไ]+/;

export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const firstChar = (w: string) => w.replace(LEADING_VOWELS, "").charAt(0) || w.charAt(0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2);
  return firstChar(words[0]) + firstChar(words[1]);
}
