import { WEATHER_CONDITIONS, type WeatherCondition } from '@modules/weather/weather.types';

/** Round a number to a fixed number of decimal places (default 1). */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Convert Celsius to Fahrenheit, rounded to 1 decimal place. */
export function celsiusToFahrenheit(celsius: number): number {
  return round(celsius * (9 / 5) + 32);
}

/**
 * Map an OpenWeatherMap "weather condition id" to one of our four simple
 * labels. Codes are grouped per https://openweathermap.org/weather-conditions:
 *   2xx Thunderstorm, 3xx Drizzle, 5xx Rain  -> Rainy
 *   6xx Snow                                 -> Snowy
 *   7xx Atmosphere (mist/fog/haze/etc.)      -> Cloudy
 *   800 Clear                                -> Sunny
 *   80x Clouds                               -> Cloudy
 */
export function conditionFromCode(code: number): WeatherCondition {
  if (code >= 200 && code < 600) {
    return WEATHER_CONDITIONS.RAINY;
  }
  if (code >= 600 && code < 700) {
    return WEATHER_CONDITIONS.SNOWY;
  }
  if (code === 800) {
    return WEATHER_CONDITIONS.SUNNY;
  }
  // 7xx atmosphere and 80x clouds both read as "Cloudy".
  return WEATHER_CONDITIONS.CLOUDY;
}

/**
 * Normalize a city name for case- and accent-insensitive lookups, so that
 * "Medellín", "medellin" and "MEDELLIN" all resolve to the same cache key.
 */
export function normalizeCityKey(city: string): string {
  return city
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}
