import type { Server } from 'node:http';
import type { ScheduledTask } from 'node-cron';

import { config } from '@config/env';
import { logger } from '@shared/utils/logger';
import { createApp } from './app';
import { startWeatherRefreshJob } from '@jobs/weatherRefresh.job';

/**
 * Entry point. Builds the app, warms the cache with an initial fetch, schedules
 * the recurring refresh, starts listening, and wires up graceful shutdown.
 */
async function bootstrap(): Promise<void> {
  const { app, weatherService } = createApp();

  // Warm the cache on boot. refreshAll() never throws (per-city failures are
  // handled internally), so the server still starts if OpenWeatherMap is down.
  logger.info('Performing initial weather fetch...');
  await weatherService.refreshAll();

  const refreshTask: ScheduledTask = startWeatherRefreshJob(weatherService);

  const server: Server = app.listen(config.PORT, () => {
    const baseUrl = `http://localhost:${config.PORT}`;
    logger.info(`🌦️  Weather Middleware API listening on ${baseUrl}`);
    logger.info(`Environment: ${config.NODE_ENV}`);
    // Print ready-to-test endpoint URLs (with example params) for convenience.
    logger.info('Available endpoints:');
    logger.info(`   Welcome      GET  ${baseUrl}/`);
    logger.info(`   All cities   GET  ${baseUrl}/weather`);
    logger.info(`   One city     GET  ${baseUrl}/weather/Oslo`);
    logger.info(`   Compare      GET  ${baseUrl}/weather/compare?cities=Oslo,Lisbon`);
    logger.info(`   Health       GET  ${baseUrl}/health`);
  });

  setupGracefulShutdown(server, refreshTask);
}

/** Stop accepting connections and clean up timers on SIGINT/SIGTERM. */
function setupGracefulShutdown(server: Server, refreshTask: ScheduledTask): void {
  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}, shutting down gracefully...`);
    refreshTask.stop();
    server.close((err?: Error) => {
      if (err) {
        logger.error('Error during server shutdown', err);
        process.exit(1);
      }
      logger.info('Server closed. Bye 👋');
      process.exit(0);
    });

    // Force-exit if connections don't drain within 10s.
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Last-resort safety nets for truly unexpected failures.
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled promise rejection', reason);
  });
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught exception — exiting', error);
    process.exit(1);
  });
}

void bootstrap();
