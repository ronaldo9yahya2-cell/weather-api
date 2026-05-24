/**
 * The five hardcoded cities this service tracks. Each entry pairs the canonical
 * display name (what we show in responses) with the OpenWeatherMap query string.
 *
 * The query includes an ISO country code (e.g. "Oslo,NO") to avoid ambiguity —
 * several cities share names across countries, and this pins each to the one we
 * mean. To track different cities, edit this list (no other code changes needed).
 */
export interface CityConfig {
  /** Canonical display name returned in API responses. */
  readonly name: string;
  /** OpenWeatherMap `q` parameter, "City,CountryCode". */
  readonly query: string;
}

export const CITIES: readonly CityConfig[] = [
  { name: 'Oslo', query: 'Oslo,NO' },
  { name: 'Lisbon', query: 'Lisbon,PT' },
  { name: 'Nairobi', query: 'Nairobi,KE' },
  { name: 'Osaka', query: 'Osaka,JP' },
  { name: 'Medellín', query: 'Medellín,CO' },
] as const;
