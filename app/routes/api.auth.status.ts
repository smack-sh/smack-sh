import { getAuth } from '@clerk/remix/ssr.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { hasConfiguredClerkKey } from '~/utils/clerk-key';

export async function loader(args: LoaderFunctionArgs) {
  const key = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!hasConfiguredClerkKey(key)) {
    return json({ authenticated: false, userId: null });
  }

  try {
    const { userId } = await getAuth(args);
    return json({ authenticated: Boolean(userId), userId: userId || null });
  } catch {
    return json({ authenticated: false, userId: null });
  }
}
