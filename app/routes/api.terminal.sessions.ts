import { json, type LoaderFunctionArgs, type ActionFunctionArgs } from '@remix-run/node';
import { requireAuth } from '~/utils/auth.server';
import { getTerminalSessions, createTerminalSession } from '~/models/terminal.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await requireAuth({ request });

  try {
    const sessions = await getTerminalSessions(userId);
    return json({ sessions });
  } catch (error) {
    console.error('Failed to fetch terminal sessions:', error);
    return json({ error: 'Failed to fetch terminal sessions' }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireAuth({ request });

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const environment = (formData.get('environment') as string) || 'development';

    if (!name) {
      return json({ error: 'Name is required' }, { status: 400 });
    }

    const session = await createTerminalSession(userId, name, environment);

    return json({ session });
  } catch (error) {
    console.error('Failed to create terminal session:', error);
    return json({ error: 'Failed to create terminal session' }, { status: 500 });
  }
}
