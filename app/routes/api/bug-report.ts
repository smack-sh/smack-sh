import { json } from '@remix-run/node';
import { sendBugReport } from '~/utils/email.server';

export async function action({ request }: ActionFunctionArgs) {
  try {
    const { email, subject, message } = await request.json();

    if (!email || !subject || !message) {
      return json({ error: 'Email, subject, and message are required' }, { status: 400 });
    }

    const result = await sendBugReport({ email, subject, message });

    if ('error' in result) {
      return json({ error: 'Failed to send bug report' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Bug report error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
