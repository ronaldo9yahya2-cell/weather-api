/**
 * Domain types for the weather module. `WeatherData` is the single flat shape
 * we cache and return — no deeply nested objects, per the project brief.
 */

/** The four simple, human-friendly condition labels we expose. */
export const WEATHER_CONDITIONS = {
  SUNNY: 'Sunny',
  CLOUDY: 'Cloudy',
  RAINY: 'Rainy',
  SNOWY: 'Snowy',
} as const;

export type WeatherCondition = (typeof WEATHER_CONDITIONS)[keyof typeof WEATHER_CONDITIONS];

/**
 * Flat, normalized weather record for a single city. This is exactly what the
 * `/weather` endpoints return (the cache stores it as-is).
 */
export interface WeatherData {
  readonly city: string;
  readonly country: string;
  /** Temperature in degrees Celsius. */
  readonly temperatureC: number;
  /** Temperature in degrees Fahrenheit. */
  readonly temperatureF: number;
  /** Relative humidity, percent (0–100). */
  readonly humidity: number;
  /** Wind speed in metres per second (OpenWeatherMap metric units). */
  readonly windSpeed: number;
  /** Simplified label derived from the OpenWeatherMap condition code. */
  readonly condition: WeatherCondition;
  /** Raw OpenWeatherMap text description, e.g. "broken clouds". */
  readonly description: string;
  /** Raw OpenWeatherMap condition code (kept for transparency/debugging). */
  readonly weatherCode: number;
  /** ISO 8601 timestamp of when this record was last successfully fetched. */
  readonly lastFetch: string;
  /** True when served from cache because the upstream API was unreachable. */
  readonly stale: boolean;
}
