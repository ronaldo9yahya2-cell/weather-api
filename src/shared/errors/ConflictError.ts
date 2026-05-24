import { AppError } from './AppError';

/** 409 — the request conflicts with the current state of the resource. */
export class ConflictError extends AppError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, 409, 'CONFLICT', true, details);
  }
}
