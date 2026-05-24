import cron, { type ScheduledTask } from 'node-cron';
import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import type { WeatherService } from '@modules/weather/weather.service';

/**
 * Schedule the recurring weather refresh (default: every 30 minutes, see
 * WEATHER_REFRESH_CRON). The initial fetch on boot is triggered separately in
 * server.ts so data is warm before the first scheduled run.
 *
 * Returns the ScheduledTask so the caller can stop it during graceful shutdown.
 */
export function startWeatherRefreshJob(weatherService: WeatherService): ScheduledTask {
  if (!cron.validate(config.WEATHER_REFRESH_CRON)) {
    throw new Error(`Invalid WEATHER_REFRESH_CRON expression: "${config.WEATHER_REFRESH_CRON}"`);
  }

  const task = cron.schedule(config.WEATHER_REFRESH_CRON, () => {
    logger.info('Scheduled weather refresh triggered');
    // node-cron does not await the callback; guard the promise ourselves so an
    // unexpected rejection can never become an unhandled rejection.
    void weatherService.refreshAll().catch((error: unknown) => {
      logger.error('Scheduled weather refresh threw unexpectedly', error);
    });
  });

  logger.info(`Weather refresh job scheduled with cron "${config.WEATHER_REFRESH_CRON}"`);
  return task;
}
