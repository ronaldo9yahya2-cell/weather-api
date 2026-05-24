/**
 * Shared, generic shapes for the JSON envelope every endpoint returns.
 * The envelope stays consistent across the API; the `data` payload itself is
 * always kept flat (no deeply nested objects), per the project requirements.
 */

/** Successful response envelope. `T` is the concrete payload type. */
export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly message?: string;
  readonly meta?: Readonly<Record<string, unknown>>;
}

/** Error response envelope (produced only by the global error handler). */
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
