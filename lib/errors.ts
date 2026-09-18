// Error ที่ "คาดไว้" — service throw class เหล่านี้เท่านั้น ข้อความส่งถึงผู้ใช้ได้ตรงๆ
export type FieldErrors = Record<string, string[]>;

export class AppError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "ไม่พบข้อมูล") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "คุณไม่มีสิทธิ์ทำรายการนี้") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "ข้อมูลไม่ถูกต้อง",
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message, 400, "VALIDATION");
  }
}

export class InvalidTransitionError extends AppError {
  constructor(message: string) {
    super(message, 409, "INVALID_TRANSITION");
  }
}
