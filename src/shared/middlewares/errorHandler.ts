import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@shared/errors';
import type { ApiErrorResponse } from '@shared/types/api.types';
import { logger } from '@shared/utils/logger';
import { config } from '@config/env';

/** Flatten a ZodError into `{ field: message }` pairs for client-friendly output. */
function formatZodIssues(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_';
    fieldErrors[path] = issue.message;
  }
  return fieldErrors;
}

/**
 * Central error-handling middleware. MUST be registered last and MUST keep all
 * four parameters — Express identifies error handlers by arity.
 *
 * - Zod validation errors  -> 422 with field-level details
 * - Known AppError         -> its own statusCode/code/message
 * - Anything else          -> 500 (details hidden in production)
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4th arg to detect an error handler.
  _next: NextFunction,
): void {
  // 1) Zod validation failures.
  if (err instanceof ZodError) {
    const details = formatZodIssues(err);
    logger.warn(`Validation failed: ${req.method} ${req.originalUrl}`, details);
    const body: ApiErrorResponse = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details },
    };
    res.status(422).json(body);
    return;
  }

  // 2) Errors we threw on purpose.
  if (err instanceof AppError) {
    const logMeta = { code: err.code, statusCode: err.statusCode, details: err.details };
    if (err.statusCode >= 500) {
      logger.error(`${err.code}: ${err.message}`, logMeta);
    } else {
      logger.warn(`${err.code}: ${err.message}`, logMeta);
    }
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // 3) Unknown / programmer errors — log everything, leak nothing in production.
  const error = err instanceof Error ? err : new Error('Unknown error');
  logger.error(`Unhandled error: ${req.method} ${req.originalUrl}`, error);
  logger.error(error.stack ?? 'no stack trace available');

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        config.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : error.message,
    },
  };
  res.status(500).json(body);
}
