import { celsiusToFahrenheit, conditionFromCode, round } from '@shared/utils/weather.helper';
import type { OwmCurrentWeather } from './weather.provider';
import type { WeatherData } from './weather.types';

/** Extra context the mapper needs that isn't in the raw upstream payload. */
interface MapOptions {
  /** Canonical display name from our city config (preserves accents, casing). */
  readonly displayName: string;
  /** ISO 8601 timestamp to record as the fetch time. */
  readonly fetchedAt: string;
}

/**
 * Transform a validated OpenWeatherMap reading into our flat domain record.
 * All derived/rounded values are computed here so storage and presentation
 * stay consistent.
 */
export function mapToWeatherData(raw: OwmCurrentWeather, options: MapOptions): WeatherData {
  // `weather` is guaranteed non-empty by the provider's schema (`.min(1)`).
  const primary = raw.weather[0];
  if (primary === undefined) {
    // Defensive: should be unreachable given upstream validation.
    throw new Error('OpenWeatherMap reading contained no weather entries');
  }

  return {
    city: options.displayName,
    country: raw.sys?.country ?? 'Unknown',
    temperatureC: round(raw.main.temp),
    temperatureF: celsiusToFahrenheit(raw.main.temp),
    humidity: Math.round(raw.main.humidity),
    windSpeed: round(raw.wind.speed),
    condition: conditionFromCode(primary.id),
    description: primary.description,
    weatherCode: primary.id,
    lastFetch: options.fetchedAt,
    stale: false,
  };
}
