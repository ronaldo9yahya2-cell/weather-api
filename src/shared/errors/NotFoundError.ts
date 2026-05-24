import { AppError } from './AppError';

/** 404 — a requested resource (e.g. an unknown city) does not exist. */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', details?: unknown) {
    super(message, 404, 'NOT_FOUND', true, details);
  }
}
