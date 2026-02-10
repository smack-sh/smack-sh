import { type ActionFunctionArgs } from '@remix-run/cloudflare';
import { executePython, type PythonExecutionOptions } from '~/lib/python/executor';
import {
  checkRateLimit,
  recordRequest,
  trackUsage,
  hasExceededQuota,
  getRemainingQuota,
  getUsageConfig,
} from '~/lib/python/usage-tracker';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('api.python.execute');

/**
 * Python code execution request body
 */
interface PythonExecuteRequest {
  code: string;
  options?: PythonExecutionOptions;
}

/**
 * Python code execution response
 */
interface PythonExecuteResponse {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  variables?: Record<string, unknown>;
  rateLimit?: {
    remaining: number;
    resetTime: number;
    dailyQuota: number;
  };
}

/**
 * Get user ID from request (using IP or session)
 * In production, this should use proper authentication
 */
function getUserId(request: Request): string {
  // Try to get from CF-Connecting-IP header (Cloudflare)
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return `ip_${cfIp}`;
  }

  // Try to get from X-Forwarded-For header
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    return `ip_${forwardedFor.split(',')[0].trim()}`;
  }

  // Fallback to a default user (for development)
  return 'default_user';
}

/**
 * Validate and sanitize the request
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: PythonExecuteRequest } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { code, options } = body as PythonExecuteRequest;

  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Code is required and must be a string' };
  }

  // Basic size validation
  const MAX_CODE_SIZE = 100 * 1024; // 100KB
  if (code.length > MAX_CODE_SIZE) {
    return { valid: false, error: `Code size exceeds maximum of ${MAX_CODE_SIZE / 1024}KB` };
  }

  // Keep raw Python code - no HTML sanitization needed
  // The code will be executed in a secure sandbox environment
  const rawCode = code;

  return {
    valid: true,
    data: {
      code: rawCode,
      options,
    },
  };
}

/**
 * API action handler for Python code execution
 */
export async function action({ request }: ActionFunctionArgs) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Method not allowed. Use POST.',
      }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const userId = getUserId(request);

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(userId);

    if (!rateLimit.allowed) {
      logger.warn(`Rate limit exceeded for user ${userId}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          rateLimit: {
            remaining: 0,
            resetTime: rateLimit.resetTime,
            retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
          },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
            'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
          },
        },
      );
    }

    // Check daily quota
    if (hasExceededQuota(userId)) {
      const remainingQuota = getRemainingQuota(userId);
      logger.warn(`Daily quota exceeded for user ${userId}`);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Daily quota exceeded. Please try again tomorrow.',
          quota: {
            remaining: remainingQuota,
            dailyQuota: getUsageConfig().dailyQuota,
          },
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    // Validate request
    const validation = validateRequest(body);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const { code, options } = validation.data;

    // Record the request for rate limiting
    recordRequest(userId);

    logger.info(`Executing Python code for user ${userId}`);

    // Execute the Python code
    const result = await executePython(code, {
      captureVariables: options?.captureVariables ?? true,
      timeout: options?.timeout ?? 30000,
    });

    // Track usage
    trackUsage(userId, result.executionTime, result.success);

    // Prepare response
    const response: PythonExecuteResponse = {
      success: result.success,
      output: result.output,
      error: result.error,
      executionTime: result.executionTime,
      variables: result.variables,
      rateLimit: {
        remaining: rateLimit.remaining - 1,
        resetTime: rateLimit.resetTime,
        dailyQuota: getUsageConfig().dailyQuota,
      },
    };

    logger.info(`Python execution completed in ${result.executionTime}ms for user ${userId}`);

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining - 1),
        'X-RateLimit-Reset': String(Math.ceil(rateLimit.resetTime / 1000)),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    logger.error('Error executing Python code:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

/**
 * Health check endpoint
 */
export async function loader() {
  const config = getUsageConfig();

  return new Response(
    JSON.stringify({
      status: 'healthy',
      service: 'python-execution-api',
      version: '1.0.0',
      config: {
        rateLimitRequests: config.rateLimitRequests,
        rateLimitWindowMinutes: config.rateLimitWindowMinutes,
        dailyQuota: config.dailyQuota,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

export default { action, loader };
