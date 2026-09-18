import { describe, expect, it } from "vitest";
import { getInitials } from "./initials";

describe("getInitials", () => {
  it("สองคำ → อักษรแรกของแต่ละคำ", () => {
    expect(getInitials("สมชาย ส.")).toBe("สส");
  });
  it("ข้ามสระนำ", () => {
    expect(getInitials("วิรัช เจริญพร")).toBe("วจ");
  });
  it("คำเดียว → 2 ตัวแรก", () => {
    expect(getInitials("ปรีดา")).toBe("ปร");
  });
  it("ว่าง → ?", () => {
    expect(getInitials("  ")).toBe("?");
  });
});
