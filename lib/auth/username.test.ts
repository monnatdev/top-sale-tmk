import { describe, expect, it } from "vitest";
import { emailToUsername, LOGIN_EMAIL_DOMAIN, usernameToEmail } from "./username";

describe("usernameToEmail", () => {
  it("แปลงเป็นอีเมลภายใน ตัดช่องว่าง เป็นตัวเล็ก", () => {
    expect(usernameToEmail("  Somchai.S ")).toBe(`somchai.s@${LOGIN_EMAIL_DOMAIN}`);
  });
  it("แปลงกลับได้", () => {
    expect(emailToUsername(usernameToEmail("somchai.s"))).toBe("somchai.s");
  });
});
