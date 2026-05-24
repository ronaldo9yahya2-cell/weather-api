/** Flat health payload returned by `GET /health`. */
export interface HealthStatus {
  /** Always "ok" while the process is serving requests. */
  readonly status: 'ok';
  /** Process uptime in whole seconds. */
  readonly uptimeSeconds: number;
  /** Human-readable uptime, e.g. "1h 12m 5s". */
  readonly uptimeHuman: string;
  /** ISO timestamp of the last refresh where at least one city succeeded. */
  readonly lastSuccessfulFetch: string | null;
  /** Number of cities currently held in the cache. */
  readonly citiesCached: number;
  /** ISO timestamp this health snapshot was generated. */
  readonly timestamp: string;
}
