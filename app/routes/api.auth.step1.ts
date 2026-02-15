import { json, type ActionFunctionArgs } from '@remix-run/node';
import { ThreeStepAuthService } from '~/services/auth/three-step-auth.service';

const service = new ThreeStepAuthService();

export async function action({ request }: ActionFunctionArgs) {
  try {
    const payload = (await request.json()) as { username?: string; password?: string };
    const username = payload.username?.trim();
    const password = payload.password;

    if (!username || !password) {
      return json({ error: 'Username and password are required' }, { status: 400 });
    }

    const result = await service.authenticateStep1(username, password);

    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Step 1 failed';
    return json({ error: message }, { status: 401 });
  }
}
