import { Router } from 'express';
import type { HealthController } from './health.controller';

/** Build the health router (`GET /health`). */
export function createHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get('/', controller.getHealth);
  return router;
}
