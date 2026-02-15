import { getAuth } from '@clerk/remix/ssr.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader(args: LoaderFunctionArgs) {
  try {
    const { userId } = await getAuth(args);
    return json({ authenticated: Boolean(userId), userId: userId || null });
  } catch (error) {
    console.error('Auth status check failed:', error);
    return json({ authenticated: false, userId: null });
  }
}
