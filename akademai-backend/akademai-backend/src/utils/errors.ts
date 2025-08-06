export class AppError extends Error {
  public readonly statusCode: number;
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export class NotFoundError extends AppError {
  constructor(message: string = 'Kaynak bulunamadı') {
    super(message, 404);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
export class DatabaseError extends AppError {
  constructor(message: string = 'Veritabanı hatası oluştu') {
    super(message, 500);
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}
export class ConflictError extends AppError {
  constructor(message: string = 'İşlem çakışması oluştu') {
    super(message, 409);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Yetkisiz erişim') {
    super(message, 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
export class AuthenticationError extends AppError {
  constructor(message: string = 'Kimlik doğrulama başarısız') {
    super(message, 403);
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}
export class ValidationError extends AppError {
  public readonly errors?: Record<string, string[]>;
  constructor(message: string = 'Geçersiz veri', errors?: Record<string, string[]>) {
    super(message, 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
