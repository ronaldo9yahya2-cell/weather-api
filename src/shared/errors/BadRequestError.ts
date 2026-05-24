import { AppError } from './AppError';

/** 400 — the request is malformed or missing required parameters. */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details);
  }
}
