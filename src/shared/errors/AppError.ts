/**
 * Base class for every error we deliberately throw in the application.
 *
 * "Operational" errors are expected failure modes (bad input, missing city,
 * upstream API down) that we can translate into a clean HTTP response.
 * Anything that is NOT an AppError is treated as a programmer error / bug and
 * surfaced as a generic 500 (with details hidden in production).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    // Restore the prototype chain (required when extending built-ins in TS).
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}
