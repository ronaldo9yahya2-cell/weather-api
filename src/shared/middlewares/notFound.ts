import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '@shared/errors';

/**
 * Catches any request that did not match a registered route and forwards a
 * NotFoundError to the central error handler. Registered AFTER all routes.
 */
export function notFound(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
