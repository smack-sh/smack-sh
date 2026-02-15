import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();
const ipAttempts = new Map<string, { count: number; resetAt: number }>();
const sessionAttempts = new Map<string, { count: number; lockUntil?: number; resetAt: number }>();

const IP_WINDOW_MS = 60_000;
const IP_MAX_REQUESTS = 30;
const SESSION_WINDOW_MS = 10 * 60 * 1000;
const SESSION_MAX_ATTEMPTS = 8;
const SESSION_LOCKOUT_MS = 10 * 60 * 1000;

type Step2VerifyPayload = { sessionId?: string; code?: string };

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

function getSessionLockError(sessionId: string) {
  const now = Date.now();
  const sessionRecord = sessionAttempts.get(sessionId);

  if (sessionRecord?.lockUntil && sessionRecord.lockUntil > now) {
    return 'Session is temporarily locked due to too many attempts';
  }

  return null;
}

function trackSessionFailure(sessionId: string) {
  if (!sessionId) {
    return;
  }

  const now = Date.now();
  const current = sessionAttempts.get(sessionId);
  const next =
    !current || current.resetAt <= now
      ? { count: 1, resetAt: now + SESSION_WINDOW_MS, lockUntil: undefined as number | undefined }
      : { ...current, count: current.count + 1 };

  if (next.count >= SESSION_MAX_ATTEMPTS) {
    next.lockUntil = now + SESSION_LOCKOUT_MS;
  }

  sessionAttempts.set(sessionId, next);
}

function parsePayload(payload: Step2VerifyPayload) {
  return {
    sessionId: payload.sessionId?.trim() || '',
    code: payload.code?.trim() || '',
  };
}

export async function action({ request }: ActionFunctionArgs) {
  let sessionIdForTracking = '';

  try {
    const ip = getClientIp(request);

    if (isIpRateLimited(ip)) {
      return json({ error: 'Too many verification attempts from this IP' }, { status: 429 });
    }

    const payload = (await request.json()) as Step2VerifyPayload;
    const { sessionId, code } = parsePayload(payload);
    sessionIdForTracking = sessionId;

    if (!sessionId || !code) {
      return json({ error: 'sessionId and code are required' }, { status: 400 });
    }

    const lockError = getSessionLockError(sessionId);

    if (lockError) {
      return json({ error: lockError }, { status: 429 });
    }

    const result = await service.verifyEmailCode(sessionId, code);
    sessionAttempts.delete(sessionId);

    return json(result);
  } catch (error) {
    trackSessionFailure(sessionIdForTracking);

    const message = error instanceof Error ? error.message : 'Unable to verify code';
    const status = message.toLowerCase().includes('locked') ? 429 : 400;

    return json({ error: message }, { status });
  }
}
