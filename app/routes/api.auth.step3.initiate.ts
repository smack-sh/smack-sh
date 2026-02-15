import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as { step2Token?: string };

    if (!payload.step2Token) {
      return json({ error: 'step2Token is required' }, { status: 400 });
    }

    const result = await service.initiatePasskeyAuth(payload.step2Token);

    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to initiate passkey auth';
    return json({ error: message }, { status: 400 });
  }
}
