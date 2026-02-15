import { config } from 'dotenv';
import { z } from 'zod';

config({ path: '.env.local' });
config({ path: '.env' });
config();

const envSchema = z.object({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_PUBLIC_KEY: z.string().min(1, 'STRIPE_PUBLIC_KEY is required'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),
  AI_DB_PASSWORD: z.string().min(1, 'AI_DB_PASSWORD is required'),
  APP_URL: z.string().url('APP_URL must be a valid URL').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required').optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SMTP_TO: z.string().optional(),
  AI_DB_USER: z.string().optional(),
  AI_DB_HOST: z.string().optional(),
  AI_DB_NAME: z.string().optional(),
  AI_DB_PORT: z.string().optional(),
  CODE_DB_USER: z.string().optional(),
  CODE_DB_HOST: z.string().optional(),
  CODE_DB_NAME: z.string().optional(),
  CODE_DB_PASSWORD: z.string().optional(),
  CODE_DB_PORT: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const details = parsedEnv.error.errors.map((error) => `${error.path.join('.')}: ${error.message}`).join('\n');
  throw new Error(`Invalid server environment variables:\n${details}`);
}

export const env = parsedEnv.data;
