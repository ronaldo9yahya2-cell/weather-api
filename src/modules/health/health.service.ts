import type { WeatherService } from '@modules/weather/weather.service';
import type { HealthStatus } from './health.types';

/** Format a duration in seconds as a compact "Xh Ym Zs" string. */
function formatUptime(totalSeconds: number): string {
  const seconds = Math.floor(totalSeconds % 60);
  const minutes = Math.floor((totalSeconds / 60) % 60);
  const hours = Math.floor(totalSeconds / 3600);
  return `${hours}h ${minutes}m ${seconds}s`;
}

/**
 * Builds the health snapshot. Reads uptime from the process and last-fetch /
 * cache stats from the weather service.
 */
export class HealthService {
  private readonly weatherService: WeatherService;

  constructor(weatherService: WeatherService) {
    this.weatherService = weatherService;
  }

  public getHealth(): HealthStatus {
    const uptimeSeconds = Math.floor(process.uptime());
    return {
      status: 'ok',
      uptimeSeconds,
      uptimeHuman: formatUptime(uptimeSeconds),
      lastSuccessfulFetch: this.weatherService.getLastSuccessfulFetchAt(),
      citiesCached: this.weatherService.getCachedCount(),
      timestamp: new Date().toISOString(),
    };
  }
}
