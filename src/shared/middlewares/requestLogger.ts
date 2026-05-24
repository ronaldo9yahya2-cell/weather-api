import morgan, { type StreamOptions } from 'morgan';
import type { RequestHandler } from 'express';
import { logger } from '@shared/utils/logger';
import { config } from '@config/env';

/** Pipe morgan's output through our structured logger instead of stdout raw. */
const stream: StreamOptions = {
  write: (message: string): void => {
    logger.info(message.trim());
  },
};

/**
 * HTTP request logging. Uses the concise "dev" format locally and the more
 * detailed "combined" (Apache-style) format in production.
 */
export const requestLogger: RequestHandler = morgan(
  config.NODE_ENV === 'production' ? 'combined' : 'dev',
  { stream },
);
