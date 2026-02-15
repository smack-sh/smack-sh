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

export async function action({ request }: ActionFunctionArgs) {
  let sessionIdForTracking = '';

  try {
    const ip = getClientIp(request);

    if (isIpRateLimited(ip)) {
      return json({ error: 'Too many verification attempts from this IP' }, { status: 429 });
    }

    const payload = (await request.json()) as { sessionId?: string; code?: string };
    sessionIdForTracking = payload.sessionId?.trim() || '';

    if (!payload.sessionId || !payload.code) {
      return json({ error: 'sessionId and code are required' }, { status: 400 });
    }

    const now = Date.now();
    const sessionRecord = sessionAttempts.get(payload.sessionId);

    if (sessionRecord?.lockUntil && sessionRecord.lockUntil > now) {
      return json({ error: 'Session is temporarily locked due to too many attempts' }, { status: 429 });
    }

    const result = await service.verifyEmailCode(payload.sessionId, payload.code);
    sessionAttempts.delete(payload.sessionId);

    return json(result);
  } catch (error) {
    if (sessionIdForTracking) {
      const now = Date.now();
      const current = sessionAttempts.get(sessionIdForTracking);
      const next =
        !current || current.resetAt <= now
          ? { count: 1, resetAt: now + SESSION_WINDOW_MS, lockUntil: undefined as number | undefined }
          : { ...current, count: current.count + 1 };

      if (next.count >= SESSION_MAX_ATTEMPTS) {
        next.lockUntil = now + SESSION_LOCKOUT_MS;
      }

      sessionAttempts.set(sessionIdForTracking, next);
    }

    const message = error instanceof Error ? error.message : 'Unable to verify code';
    const status = message.toLowerCase().includes('locked') ? 429 : 400;

    return json({ error: message }, { status });
  }
}
