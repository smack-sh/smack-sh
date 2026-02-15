import { json, type ActionFunctionArgs } from '@remix-run/node';
import { env } from '~/config/env.server';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as {
      step2Token?: string;
      credential?: {
        id: string;
        type: 'public-key';
        response: {
          clientDataJSON: string;
          authenticatorData?: string;
          signature?: string;
          userHandle?: string | null;
        };
      };
    };

    if (!payload.step2Token || !payload.credential) {
      return json({ error: 'step2Token and credential are required' }, { status: 400 });
    }

    const result = await service.verifyPasskey(
      payload.step2Token,
      payload.credential,
      env.APP_URL || new URL(request.url).origin,
    );

    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify passkey';
    return json({ error: message }, { status: 400 });
  }
}
