import { z } from 'zod';
import { config } from '@config/env';
import { AppError } from '@shared/errors';

/**
 * Schema for the subset of the OpenWeatherMap "current weather" response we
 * actually use. Validating the upstream payload means a shape change there
 * surfaces as a clear error rather than an `undefined` crash deeper in the app.
 */
const owmResponseSchema = z.object({
  weather: z
    .array(
      z.object({
        id: z.number(),
        main: z.string(),
        description: z.string(),
      }),
    )
    .min(1),
  main: z.object({
    temp: z.number(),
    humidity: z.number(),
  }),
  wind: z.object({
    speed: z.number(),
  }),
  name: z.string(),
  sys: z
    .object({
      country: z.string().optional(),
    })
    .optional(),
});

/** Validated raw reading from OpenWeatherMap. */
export type OwmCurrentWeather = z.infer<typeof owmResponseSchema>;

/** Thrown when the upstream API call fails. Service treats this as "API down". */
export class WeatherProviderError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 502, 'WEATHER_PROVIDER_ERROR', true, details);
  }
}

/**
 * Abstraction over the external weather source. The service depends on this
 * interface (not the concrete class), so swapping OpenWeatherMap for another
 * provider — or a mock in tests — requires no service changes.
 */
export interface IWeatherProvider {
  fetchCurrent(query: string): Promise<OwmCurrentWeather>;
}

/** Concrete OpenWeatherMap implementation using the built-in `fetch`. */
export class OpenWeatherMapProvider implements IWeatherProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;

  constructor(
    baseUrl: string = config.OPENWEATHER_BASE_URL,
    apiKey: string = config.OPENWEATHER_API_KEY,
    timeoutMs: number = config.REQUEST_TIMEOUT_MS,
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.timeoutMs = timeoutMs;
  }

  public async fetchCurrent(query: string): Promise<OwmCurrentWeather> {
    const url = new URL(`${this.baseUrl}/weather`);
    url.searchParams.set('q', query);
    url.searchParams.set('units', 'metric'); // temperatures in Celsius, wind in m/s
    url.searchParams.set('appid', this.apiKey);

    // Abort the request if the upstream is slow, so the cron job never hangs.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (error) {
      const reason =
        error instanceof Error && error.name === 'AbortError'
          ? `request timed out after ${this.timeoutMs}ms`
          : error instanceof Error
            ? error.message
            : 'unknown network error';
      throw new WeatherProviderError(`Failed to reach OpenWeatherMap for "${query}": ${reason}`);
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new WeatherProviderError(
        `OpenWeatherMap returned HTTP ${response.status} for "${query}"`,
        { status: response.status, body: bodyText.slice(0, 300) },
      );
    }

    const json: unknown = await response.json().catch(() => null);
    const parsed = owmResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new WeatherProviderError(
        `Unexpected OpenWeatherMap response shape for "${query}"`,
        parsed.error.issues,
      );
    }
    return parsed.data;
  }
}
