import { AppError } from './AppError';

/**
 * 503 — we cannot serve the request right now. Used on a cold start when the
 * upstream weather API is unreachable AND we have no cached data to fall back
 * on (once any data is cached, we serve it stale instead of failing).
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details?: unknown) {
    super(message, 503, 'SERVICE_UNAVAILABLE', true, details);
  }
}
