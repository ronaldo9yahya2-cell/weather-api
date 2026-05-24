import { normalizeCityKey } from '@shared/utils/weather.helper';
import type { WeatherData } from './weather.types';

/**
 * Data-access abstraction for cached weather records. The service depends on
 * this interface, so the in-memory store can later be swapped for Redis, a
 * database, etc. without touching business logic (dependency inversion).
 */
export interface IWeatherRepository {
  /** Insert or replace the record for a city. */
  upsert(data: WeatherData): void;
  /** Get one city's record (case/accent-insensitive), or undefined if absent. */
  get(city: string): WeatherData | undefined;
  /** Get every cached record, ordered by insertion. */
  getAll(): WeatherData[];
  /** Whether a record exists for the given city. */
  has(city: string): boolean;
  /** Number of cached cities. */
  size(): number;
}

/**
 * In-memory cache backed by a Map keyed on a normalized city name. This is the
 * "in-memory cache" the brief asks for; records are simply overwritten on each
 * successful refresh.
 */
export class InMemoryWeatherRepository implements IWeatherRepository {
  private readonly store = new Map<string, WeatherData>();

  public upsert(data: WeatherData): void {
    this.store.set(normalizeCityKey(data.city), data);
  }

  public get(city: string): WeatherData | undefined {
    return this.store.get(normalizeCityKey(city));
  }

  public getAll(): WeatherData[] {
    return Array.from(this.store.values());
  }

  public has(city: string): boolean {
    return this.store.has(normalizeCityKey(city));
  }

  public size(): number {
    return this.store.size;
  }
}
