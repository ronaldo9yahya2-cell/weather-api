import type { Request, Response } from 'express';
import { success } from '@shared/utils/response.helper';
import type { HealthService } from './health.service';

/** HTTP layer for the health module. */
export class HealthController {
  private readonly service: HealthService;

  constructor(service: HealthService) {
    this.service = service;
  }

  /** GET /health — uptime and last successful fetch time. */
  public getHealth = (_req: Request, res: Response): void => {
    res.status(200).json(success(this.service.getHealth(), 'Service is healthy'));
  };
}
