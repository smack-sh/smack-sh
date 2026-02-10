import { z } from 'zod';
import { config } from 'dotenv';

// Load environment variables
config();

/**
 * Environment variable schema with validation
 * All critical environment variables must be defined
 */
const envSchema = z.object({
  // Stripe Configuration
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_PUBLIC_KEY: z.string().min(1, 'STRIPE_PUBLIC_KEY is required'),

  // SMTP Configuration
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASS: z.string().min(1, 'SMTP_PASS is required'),

  // Database Configuration
  AI_DB_PASSWORD: z.string().min(1, 'AI_DB_PASSWORD is required'),
  CODE_DB_PASSWORD: z.string().min(1, 'CODE_DB_PASSWORD is required'),

  // Optional with defaults
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  AI_DB_USER: z.string().default('postgres'),
  AI_DB_HOST: z.string().default('localhost'),
  AI_DB_NAME: z.string().default('smack_ai'),
  AI_DB_PORT: z.string().default('5432'),
  CODE_DB_USER: z.string().default('postgres'),
  CODE_DB_HOST: z.string().default('localhost'),
  CODE_DB_NAME: z.string().default('smack_code'),
  CODE_DB_PORT: z.string().default('5433'),
});

/**
 * Parsed and validated environment variables
 * Throws an error if required variables are missing
 */
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const errors = parsedEnv.error.errors.map((err) => `  - ${err.path.join('.')}: ${err.message}`).join('\n');

  const errorMessage = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                         CRITICAL ENVIRONMENT ERROR                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ The following required environment variables are missing or invalid:         ║
╠══════════════════════════════════════════════════════════════════════════════╣
${errors}
╠══════════════════════════════════════════════════════════════════════════════╣
║ Please check your .env file and ensure all required variables are set.       ║
╚══════════════════════════════════════════════════════════════════════════════╝
  `;

  // eslint-disable-next-line no-console
  console.error(errorMessage);
  throw new Error('Environment validation failed. Application cannot start.');
}

/**
 * Validated environment configuration
 * Use this instead of process.env directly for type-safe access
 */
export const env = parsedEnv.data;

/**
 * Database environment configuration
 */
export const dbEnv = {
  ai: {
    user: env.AI_DB_USER,
    password: env.AI_DB_PASSWORD,
    host: env.AI_DB_HOST,
    database: env.AI_DB_NAME,
    port: parseInt(env.AI_DB_PORT, 10),
  },
  code: {
    user: env.CODE_DB_USER,
    password: env.CODE_DB_PASSWORD,
    host: env.CODE_DB_HOST,
    database: env.CODE_DB_NAME,
    port: parseInt(env.CODE_DB_PORT, 10),
  },
};

/**
 * Stripe environment configuration
 */
export const stripeEnv = {
  secretKey: env.STRIPE_SECRET_KEY,
  publicKey: env.STRIPE_PUBLIC_KEY,
};

/**
 * SMTP environment configuration
 */
export const smtpEnv = {
  host: env.SMTP_HOST,
  user: env.SMTP_USER,
  pass: env.SMTP_PASS,
};

export default env;
