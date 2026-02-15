import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as { sessionId?: string; code?: string };

    if (!payload.sessionId || !payload.code) {
      return json({ error: 'sessionId and code are required' }, { status: 400 });
    }

    const result = await service.verifyEmailCode(payload.sessionId, payload.code);

    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify code';
    return json({ error: message }, { status: 400 });
  }
}
