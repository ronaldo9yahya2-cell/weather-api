/**
 * Tiny, dependency-free structured logger. Kept deliberately small — a full
 * logging library (winston/pino) would be overkill for this service.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function format(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  if (meta === undefined) {
    return base;
  }
  // Serialize Error objects sensibly; everything else as compact JSON.
  if (meta instanceof Error) {
    return `${base} | ${meta.name}: ${meta.message}`;
  }
  try {
    return `${base} | ${JSON.stringify(meta)}`;
  } catch {
    return `${base} | [unserializable meta]`;
  }
}

export const logger = {
  info(message: string, meta?: unknown): void {
    console.log(format('info', message, meta));
  },
  warn(message: string, meta?: unknown): void {
    console.warn(format('warn', message, meta));
  },
  error(message: string, meta?: unknown): void {
    console.error(format('error', message, meta));
  },
  debug(message: string, meta?: unknown): void {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(format('debug', message, meta));
    }
  },
} as const;
