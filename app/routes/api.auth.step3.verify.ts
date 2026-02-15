import { json, type ActionFunctionArgs } from '@remix-run/node';
import { env } from '~/config/env.server';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

function serializeAuthCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

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

    const headers = new Headers();
    headers.append('Set-Cookie', serializeAuthCookie('smack_access_token', result.accessToken, 15 * 60));
    headers.append('Set-Cookie', serializeAuthCookie('smack_refresh_token', result.refreshToken, 30 * 24 * 60 * 60));

    return json({ success: true }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify passkey';
    return json({ error: message }, { status: 400 });
  }
}
