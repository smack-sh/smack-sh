import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as { sessionId?: string };

    if (!payload.sessionId) {
      return json({ error: 'sessionId is required' }, { status: 400 });
    }

    await service.sendEmailCode(payload.sessionId);

    return json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send code';
    return json({ error: message }, { status: 400 });
  }
}
