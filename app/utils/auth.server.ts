import { getAuth } from '@clerk/remix/ssr.server';
import { redirect } from '@remix-run/node';
import type { LoaderFunctionArgs } from '@remix-run/node';

/**
 * Check if user is authenticated
 */
export async function requireAuth(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect('/sign-in');
  }

  return userId;
}

/**
 * Check if user is an admin
 */
export async function requireAdmin(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);

  if (!userId) {
    throw redirect('/sign-in');
  }

  const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim());

  if (!adminUserIds.includes(userId)) {
    throw redirect('/unauthorized');
  }

  return userId;
}

/**
 * Check if current user is admin (without redirect)
 */
export async function isAdmin(args: LoaderFunctionArgs): Promise<boolean> {
  const { userId } = await getAuth(args);

  if (!userId) {
    return false;
  }

  const adminUserIds = (process.env.ADMIN_USER_IDS || '').split(',').map((id) => id.trim());

  return adminUserIds.includes(userId);
}

/**
 * Get current user ID (returns null if not authenticated)
 */
export async function getCurrentUserId(args: LoaderFunctionArgs): Promise<string | null> {
  const { userId } = await getAuth(args);
  return userId;
}
