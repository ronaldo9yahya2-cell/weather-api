import type { ApiSuccessResponse } from '@shared/types/api.types';

/**
 * Typed builder for the success envelope. Using this everywhere guarantees a
 * consistent response shape and keeps controllers free of envelope boilerplate.
 */
export function success<T>(
  data: T,
  message?: string,
  meta?: Readonly<Record<string, unknown>>,
): ApiSuccessResponse<T> {
  const response: { -readonly [K in keyof ApiSuccessResponse<T>]: ApiSuccessResponse<T>[K] } = {
    success: true,
    data,
  };
  if (message !== undefined) {
    response.message = message;
  }
  if (meta !== undefined) {
    response.meta = meta;
  }
  return response;
}
