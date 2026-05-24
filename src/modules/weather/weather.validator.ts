import { z } from 'zod';

/**
 * Zod schemas for request input. ZodErrors thrown by `.parse()` are caught by
 * the global error handler and rendered as structured 422 responses.
 */

/** `GET /weather/:city` — the path parameter. */
export const cityParamsSchema = z.object({
  city: z
    .string({ required_error: 'City name is required' })
    .trim()
    .min(1, 'City name must not be empty'),
});

export type CityParams = z.infer<typeof cityParamsSchema>;

/**
 * `GET /weather/compare?cities=cityA,cityB` — the query string.
 * Validates and normalizes the input into a typed `{ cityA, cityB }` pair,
 * guaranteeing exactly two non-empty, distinct city names.
 */
export const compareQuerySchema = z
  .object({
    cities: z
      .string({ required_error: 'The "cities" query parameter is required' })
      .min(1, 'The "cities" query parameter must not be empty'),
  })
  .transform((query, ctx): { cityA: string; cityB: string } => {
    const parts = query.cities
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0);

    const [cityA, cityB] = parts;
    if (parts.length !== 2 || cityA === undefined || cityB === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cities'],
        message: 'Provide exactly two cities, comma-separated, e.g. ?cities=Oslo,Lisbon',
      });
      return z.NEVER;
    }
    if (cityA.toLowerCase() === cityB.toLowerCase()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cities'],
        message: 'Provide two different cities to compare',
      });
      return z.NEVER;
    }
    return { cityA, cityB };
  });

export type CompareQuery = z.infer<typeof compareQuerySchema>;
