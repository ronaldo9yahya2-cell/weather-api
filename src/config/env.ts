import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Load variables from .env into process.env before we read them.
loadDotenv();

/**
 * Schema for every environment variable the app consumes. Validating here means
 * the rest of the codebase reads from a typed `config` object and never touches
 * `process.env` directly. Missing/invalid values fail fast at startup.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  OPENWEATHER_API_KEY: z
    .string({ required_error: 'OPENWEATHER_API_KEY is required (see .env.example)' })
    .min(1, 'OPENWEATHER_API_KEY must not be empty'),
  OPENWEATHER_BASE_URL: z
    .string()
    .url()
    .default('https://api.openweathermap.org/data/2.5'),

  WEATHER_REFRESH_CRON: z.string().min(1).default('*/30 * * * *'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60000),
});

/** Inferred, fully-typed config shape. */
export type AppConfig = Readonly<z.infer<typeof envSchema>>;

function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
      .join('\n');
    // Use stderr directly here: this runs before the logger is meaningfully useful.
    console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
    console.error('Tip: copy .env.example to .env and fill in the values.\n');
    process.exit(1);
  }
  return Object.freeze(parsed.data);
}

/** The single, validated, typed source of configuration for the whole app. */
export const config: AppConfig = loadConfig();
