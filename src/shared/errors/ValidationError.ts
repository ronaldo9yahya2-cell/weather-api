import { AppError } from './AppError';

/**
 * 422 — the request was understood but failed validation. `details` carries
 * structured, field-level messages so clients can show useful feedback.
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}
