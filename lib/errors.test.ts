import { describe, expect, it } from "vitest";
import { AppError, ForbiddenError, NotFoundError, ValidationError } from "./errors";

describe("errors", () => {
  it("NotFoundError defaults to 404 with Thai message", () => {
    const e = new NotFoundError();
    expect(e).toBeInstanceOf(AppError);
    expect(e.status).toBe(404);
    expect(e.name).toBe("NotFoundError");
    expect(e.message).toBe("ไม่พบข้อมูล");
  });

  it("ForbiddenError is 403", () => {
    expect(new ForbiddenError().status).toBe(403);
  });

  it("ValidationError carries fieldErrors", () => {
    const e = new ValidationError("ข้อมูลไม่ถูกต้อง", { name: ["กรุณากรอกชื่อ"] });
    expect(e.status).toBe(400);
    expect(e.fieldErrors?.name).toEqual(["กรุณากรอกชื่อ"]);
  });
});
