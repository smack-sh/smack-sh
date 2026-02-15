import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const usernameFailures = new Map<string, { count: number; lockUntil?: number }>();

const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 20;
const USER_MAX_FAILURES = 5;
const USER_LOCKOUT_MS = 10 * 60 * 1000;

type Step1Payload = { username?: string; password?: string };

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');

  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  return request.headers.get('cf-connecting-ip') || 'unknown';
}

function isIpRateLimited(ip: string) {
  const now = Date.now();
  const record = ipAttempts.get(ip);

  if (!record || record.resetAt <= now) {
    ipAttempts.set(ip, { count: 1, resetAt: now + IP_WINDOW_MS });
    return false;
  }

  record.count += 1;

  return record.count > IP_MAX_REQUESTS;
}

function getLockoutError(username: string) {
  const userFailureRecord = usernameFailures.get(username);

  if (userFailureRecord?.lockUntil && userFailureRecord.lockUntil > Date.now()) {
    return 'Too many failed attempts. Account temporarily locked.';
  }

  return null;
}

function trackUsernameFailure(username: string) {
  if (!username) {
    return;
  }

  const current = usernameFailures.get(username) || { count: 0 };
  current.count += 1;

  if (current.count >= USER_MAX_FAILURES) {
    current.lockUntil = Date.now() + USER_LOCKOUT_MS;
  }

  usernameFailures.set(username, current);
}

function parseStep1Payload(payload: Step1Payload) {
  const username = payload.username?.trim() || '';
  const password = payload.password || '';
  return { username, password };
}

export async function action({ request }: ActionFunctionArgs) {
  let attemptedUsername = '';

  try {
    const ip = getClientIp(request);

    if (isIpRateLimited(ip)) {
      return json({ error: 'Too many requests from this IP. Please try again shortly.' }, { status: 429 });
    }

    const payload = (await request.json()) as Step1Payload;
    const { username, password } = parseStep1Payload(payload);
    attemptedUsername = username;

    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }

    const lockoutError = getLockoutError(username);

    if (lockoutError) {
      return json({ error: lockoutError }, { status: 423 });
    }

    const result = await service.authenticateStep1(username, password);
    usernameFailures.delete(username);

    return json(result);
  } catch (error) {
    trackUsernameFailure(attemptedUsername);

    const message = error instanceof Error ? error.message : 'Step 1 failed';

    return json({ error: message }, { status: 401 });
  }
}
