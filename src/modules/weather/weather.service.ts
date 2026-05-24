import { CITIES, type CityConfig } from '@config/cities';
import { NotFoundError, ServiceUnavailableError } from '@shared/errors';
import { logger } from '@shared/utils/logger';
import { normalizeCityKey, round } from '@shared/utils/weather.helper';
import { mapToWeatherData } from './weather.mapper';
import type { IWeatherProvider } from './weather.provider';
import type { IWeatherRepository } from './weather.repository';
import type { WeatherData } from './weather.types';
import type { CompareResponseDto, WeatherComparisonDto } from './weather.dto';

/** Outcome summary of a refresh cycle, useful for logging and tests. */
export interface RefreshSummary {
  readonly succeeded: number;
  readonly failed: number;
  readonly total: number;
}

/**
 * Business logic for the weather module. Knows nothing about HTTP (no req/res):
 * it fetches via the provider, caches via the repository, and applies the
 * stale-on-failure rule the brief requires.
 */
export class WeatherService {
  private readonly provider: IWeatherProvider;
  private readonly repository: IWeatherRepository;
  private lastSuccessfulFetchAt: string | null = null;

  /** Normalized lookup set of the cities we are configured to track. */
  private readonly knownCities: ReadonlyMap<string, CityConfig>;

  constructor(provider: IWeatherProvider, repository: IWeatherRepository) {
    this.provider = provider;
    this.repository = repository;
    this.knownCities = new Map(CITIES.map((city) => [normalizeCityKey(city.name), city]));
  }

  /**
   * Refresh every configured city. Never throws: a per-city failure keeps the
   * previously cached record (flagged `stale`) so the API can still serve data
   * when OpenWeatherMap is unreachable.
   */
  public async refreshAll(): Promise<RefreshSummary> {
    const fetchedAt = new Date().toISOString();
    let succeeded = 0;
    let failed = 0;

    for (const city of CITIES) {
      try {
        const raw = await this.provider.fetchCurrent(city.query);
        this.repository.upsert(mapToWeatherData(raw, { displayName: city.name, fetchedAt }));
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.markStale(city.name);
        logger.warn(`Weather refresh failed for ${city.name}`, error);
      }
    }

    if (succeeded > 0) {
      this.lastSuccessfulFetchAt = fetchedAt;
    }

    const summary: RefreshSummary = { succeeded, failed, total: CITIES.length };
    logger.info(
      `Weather refresh complete: ${succeeded}/${CITIES.length} succeeded, ${failed} failed`,
    );
    return summary;
  }

  /** All cached cities. Empty only before the first successful fetch. */
  public getAll(): WeatherData[] {
    return this.repository.getAll();
  }

  /**
   * One city's data. Throws NotFoundError for a city we don't track, and
   * ServiceUnavailableError for a tracked city we couldn't fetch even once.
   */
  public getByCity(city: string): WeatherData {
    this.assertKnownCity(city);
    const data = this.repository.get(city);
    if (data === undefined) {
      throw new ServiceUnavailableError(
        `Weather data for "${city}" is not available yet. The upstream API may be unreachable; please retry shortly.`,
      );
    }
    return data;
  }

  /** Side-by-side comparison of two cities, including the requested deltas. */
  public compare(cityA: string, cityB: string): CompareResponseDto {
    const a = this.getByCity(cityA);
    const b = this.getByCity(cityB);
    return { cityA: a, cityB: b, comparison: this.buildComparison(a, b) };
  }

  /** ISO timestamp of the last refresh in which at least one city succeeded. */
  public getLastSuccessfulFetchAt(): string | null {
    return this.lastSuccessfulFetchAt;
  }

  /** Count of cities currently held in the cache. */
  public getCachedCount(): number {
    return this.repository.size();
  }

  // ── internal helpers ──────────────────────────────────────────────────────

  private buildComparison(a: WeatherData, b: WeatherData): WeatherComparisonDto {
    const pickHigher = (valueA: number, valueB: number): string | null => {
      if (valueA === valueB) {
        return null;
      }
      return valueA > valueB ? a.city : b.city;
    };

    return {
      temperatureDifferenceC: round(Math.abs(a.temperatureC - b.temperatureC)),
      temperatureDifferenceF: round(Math.abs(a.temperatureF - b.temperatureF)),
      humidityDifference: Math.abs(a.humidity - b.humidity),
      windSpeedDifference: round(Math.abs(a.windSpeed - b.windSpeed)),
      warmerCity: pickHigher(a.temperatureC, b.temperatureC),
      moreHumidCity: pickHigher(a.humidity, b.humidity),
      windierCity: pickHigher(a.windSpeed, b.windSpeed),
    };
  }

  private assertKnownCity(city: string): void {
    if (!this.knownCities.has(normalizeCityKey(city))) {
      const supported = CITIES.map((c) => c.name).join(', ');
      throw new NotFoundError(
        `Unknown city "${city}". This service tracks: ${supported}.`,
      );
    }
  }

  /** Keep the existing record but flag it stale; no-op if nothing is cached. */
  private markStale(city: string): void {
    const existing = this.repository.get(city);
    if (existing !== undefined && !existing.stale) {
      this.repository.upsert({ ...existing, stale: true });
    }
  }
}
