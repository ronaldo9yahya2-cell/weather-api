// Must be imported before any route handlers so thrown async errors propagate
// to the error-handling middleware automatically.
import 'express-async-errors';

import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { success } from '@shared/utils/response.helper';
import { requestLogger } from '@shared/middlewares/requestLogger';
import { rateLimiter } from '@shared/middlewares/rateLimiter';
import { notFound } from '@shared/middlewares/notFound';
import { errorHandler } from '@shared/middlewares/errorHandler';

import { OpenWeatherMapProvider } from '@modules/weather/weather.provider';
import { InMemoryWeatherRepository } from '@modules/weather/weather.repository';
import { WeatherService } from '@modules/weather/weather.service';
import { WeatherController } from '@modules/weather/weather.controller';
import { createWeatherRouter } from '@modules/weather/weather.routes';

import { HealthService } from '@modules/health/health.service';
import { HealthController } from '@modules/health/health.controller';
import { createHealthRouter } from '@modules/health/health.routes';

/** What the composition root exposes to the entry point. */
export interface AppContext {
  readonly app: Express;
  readonly weatherService: WeatherService;
}

/**
 * Composition root: build dependencies (provider → repository → service →
 * controller), wire up Express, and return the app plus the weather service so
 * server.ts can trigger the initial fetch and schedule the refresh job.
 *
 * No `app.listen()` here — that belongs in server.ts, which keeps this module
 * importable by tests without binding a port.
 */
export function createApp(): AppContext {
  // ── Dependency wiring (services depend on interfaces, not concretes) ──────
  const weatherProvider = new OpenWeatherMapProvider();
  const weatherRepository = new InMemoryWeatherRepository();
  const weatherService = new WeatherService(weatherProvider, weatherRepository);
  const weatherController = new WeatherController(weatherService);

  const healthService = new HealthService(weatherService);
  const healthController = new HealthController(healthService);

  // ── Express app ───────────────────────────────────────────────────────────
  const app = express();

  // Trust the first proxy hop so rate-limiting reads the real client IP on
  // platforms like Render/Vercel that sit behind a load balancer.
  app.set('trust proxy', 1);

  // Security, CORS, compression, body parsing.
  app.use(helmet());
  app.use(cors());
  app.use(compression());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Observability + abuse protection.
  app.use(requestLogger);
  app.use(rateLimiter);

  // Friendly root route describing the API.
  app.get('/', (_req: Request, res: Response): void => {
    res.status(200).json(
      success(
        {
          name: 'Weather Middleware API',
          version: '1.0.0',
          endpoints: [
            'GET /weather',
            'GET /weather/:city',
            'GET /weather/compare?cities=cityA,cityB',
            'GET /health',
          ],
        },
        'Welcome — see /health for status and /weather for data.',
      ),
    );
  });

  // Feature routers.
  app.use('/weather', createWeatherRouter(weatherController));
  app.use('/health', createHealthRouter(healthController));

  // 404 for anything unmatched, then the central error handler LAST.
  app.use(notFound);
  app.use(errorHandler);

  return { app, weatherService };
}
