import { parsePublishableKey } from '@clerk/shared/keys';

export function normalizeClerkKey(key?: string): string | undefined {
  if (!key) {
    return undefined;
  }

  const normalized = key.trim().replace(/^['"]|['"]$/g, '');

  return normalized.length > 0 ? normalized : undefined;
}

export function hasConfiguredClerkKey(key?: string): key is string {
  const normalized = normalizeClerkKey(key);

  if (!normalized || normalized.includes('your_clerk_publishable_key')) {
    return false;
  }

  try {
    parsePublishableKey(normalized);
    return true;
  } catch {
    return false;
  }
}
