import { Router } from 'express';
import type { WeatherController } from './weather.controller';

/**
 * Build the weather router. The `/compare` route is registered BEFORE the
 * `/:city` route — otherwise Express would treat "compare" as a city name.
 */
export function createWeatherRouter(controller: WeatherController): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/compare', controller.compare);
  router.get('/:city', controller.getOne);

  return router;
}
