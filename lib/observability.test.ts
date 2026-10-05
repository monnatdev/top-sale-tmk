import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "./errors";
import { reportError, reportWarning } from "./observability";

const captureException = vi.fn();
const captureMessage = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
  captureMessage: (...args: unknown[]) => captureMessage(...args),
}));

describe("reportError", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("ส่ง error ที่ไม่คาดไป Sentry พร้อม tag ที่บอกจุดเกิด", () => {
    const boom = new Error("connection reset");
    reportError("pdf", boom, { quotationId: "abc" });

    expect(captureException).toHaveBeenCalledWith(boom, { tags: { where: "pdf" }, extra: { quotationId: "abc" } });
  });

  // error ที่คาดไว้ = ผู้ใช้ทำผิดเงื่อนไข ไม่ใช่ระบบพัง — ถ้าส่งไปด้วยจะกลบ error จริงในหน้า Sentry
  it.each([new NotFoundError(), new ForbiddenError()])("ไม่ส่ง AppError ไป Sentry (%s)", (expected) => {
    reportError("action", expected);

    expect(captureException).not.toHaveBeenCalled();
  });

  it("log ฝั่ง server เสมอ ไม่ว่าจะส่ง Sentry หรือไม่", () => {
    reportError("action", new NotFoundError());

    expect(console.error).toHaveBeenCalled();
  });

  it("reportWarning ส่งเป็น level warning", () => {
    reportWarning("storage", "download failed bucket=signatures", { path: "a.png" });

    expect(captureMessage).toHaveBeenCalledWith("[storage] download failed bucket=signatures", {
      level: "warning",
      tags: { where: "storage" },
      extra: { path: "a.png" },
    });
  });
});
