import type { Request, Response } from 'express';
import { success } from '@shared/utils/response.helper';
import type { WeatherService } from './weather.service';
import { cityParamsSchema, compareQuerySchema } from './weather.validator';

/**
 * HTTP layer for the weather module. Controllers only translate between
 * req/res and the service — no business logic lives here. Methods are arrow
 * properties so they stay bound when used as Express route handlers.
 */
export class WeatherController {
  private readonly service: WeatherService;

  constructor(service: WeatherService) {
    this.service = service;
  }

  /** GET /weather — all tracked cities. */
  public getAll = (_req: Request, res: Response): void => {
    const data = this.service.getAll();
    const anyStale = data.some((entry) => entry.stale);
    res.status(200).json(
      success(data, 'Current weather for all tracked cities', {
        count: data.length,
        stale: anyStale,
        lastSuccessfulFetch: this.service.getLastSuccessfulFetchAt(),
      }),
    );
  };

  /** GET /weather/compare?cities=a,b — side-by-side comparison of two cities. */
  public compare = (req: Request, res: Response): void => {
    const { cityA, cityB } = compareQuerySchema.parse(req.query);
    const result = this.service.compare(cityA, cityB);
    res
      .status(200)
      .json(success(result, `Comparison between ${result.cityA.city} and ${result.cityB.city}`));
  };

  /** GET /weather/:city — a single city. */
  public getOne = (req: Request, res: Response): void => {
    const { city } = cityParamsSchema.parse(req.params);
    const data = this.service.getByCity(city);
    res.status(200).json(success(data, `Current weather for ${data.city}`));
  };
}
