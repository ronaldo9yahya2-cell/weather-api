import type { WeatherData } from './weather.types';

/**
 * Response DTOs — the exact payloads returned inside the API envelope's `data`.
 * Kept flat and separate from internal domain types so the wire format can
 * evolve independently of how data is stored.
 */

/** `GET /weather` and `GET /weather/:city` return WeatherData directly. */
export type WeatherResponseDto = WeatherData;

/** Flat numeric/labelled comparison between two cities. */
export interface WeatherComparisonDto {
  /** Absolute temperature gap in Celsius. */
  readonly temperatureDifferenceC: number;
  /** Absolute temperature gap in Fahrenheit. */
  readonly temperatureDifferenceF: number;
  /** Absolute humidity gap, percentage points. */
  readonly humidityDifference: number;
  /** Absolute wind-speed gap, m/s. */
  readonly windSpeedDifference: number;
  /** Name of the warmer city, or null if temperatures are equal. */
  readonly warmerCity: string | null;
  /** Name of the more humid city, or null if humidity is equal. */
  readonly moreHumidCity: string | null;
  /** Name of the windier city, or null if wind speeds are equal. */
  readonly windierCity: string | null;
}

/** Full payload for `GET /weather/compare`. */
export interface CompareResponseDto {
  readonly cityA: WeatherData;
  readonly cityB: WeatherData;
  readonly comparison: WeatherComparisonDto;
}
