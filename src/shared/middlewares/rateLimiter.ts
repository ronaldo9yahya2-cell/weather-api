import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { config } from '@config/env';
import type { ApiErrorResponse } from '@shared/types/api.types';

/**
 * Per-IP rate limiter (default: 30 requests / 60s, configurable via env).
 * Returns the same error envelope shape as the rest of the API.
 */
export const rateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true, // expose RateLimit-* headers
  legacyHeaders: false, // disable deprecated X-RateLimit-* headers
  handler: (_req: Request, res: Response): void => {
    const body: ApiErrorResponse = {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Limit is ${config.RATE_LIMIT_MAX} requests per ${Math.round(
          config.RATE_LIMIT_WINDOW_MS / 1000,
        )}s. Please slow down.`,
      },
    };
    res.status(429).json(body);
  },
});
