import { getAuth } from '@clerk/remix/ssr.server';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

function hasLikelyValidClerkKey(key?: string) {
  if (!key) {
    return false;
  }

  if (!/^pk_(test|live)_/.test(key)) {
    return false;
  }

  return key.includes('$');
}

export async function loader(args: LoaderFunctionArgs) {
  const key = process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!hasLikelyValidClerkKey(key)) {
    return json({ authenticated: false, userId: null });
  }

  try {
    const { userId } = await getAuth(args);
    return json({ authenticated: Boolean(userId), userId: userId || null });
  } catch {
    return json({ authenticated: false, userId: null });
  }
}
