export function parseCookies(cookieHeader: string | null) {
  const cookies: Record<string, string> = {};

  if (!cookieHeader) {
    return cookies;
  }

  // Split the cookie string by semicolons and spaces
  const items = cookieHeader.split(';').map((cookie) => cookie.trim());

  items.forEach((item) => {
    // Only process non-empty items after trimming
    if (!item.trim()) {
      return;
    }

    // Split only on the first '=' to correctly handle values containing '='
    const parts = item.split('=');
    const namePart = parts[0];

    // Re-join remaining parts for the value in case it contained '='
    const valuePart = parts.slice(1).join('=');

    const trimmedName = namePart.trim();

    if (trimmedName) {
      // Ensure the cookie name is not empty or just whitespace
      const decodedName = decodeURIComponent(trimmedName);
      const decodedValue = decodeURIComponent(valuePart.trim()); // Value should also be trimmed before decoding
      cookies[decodedName] = decodedValue;
    }
  });

  return cookies;
}

export function getApiKeysFromCookie(cookieHeader: string | null): Record<string, string> {
  const cookies = parseCookies(cookieHeader);
  const apiKeysJson = cookies.apiKeys;

  if (apiKeysJson) {
    try {
      const parsed = JSON.parse(apiKeysJson);

      // Ensure the parsed result is an object before casting
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, string>;
      }
    } catch (e) {
      /*
       * Log the error or handle it as appropriate for the application context.
       * For now, silently fail and return an empty object for malformed JSON.
       * console.error("Failed to parse apiKeys cookie:", e);
       */
    }
  }

  return {};
}

export function getProviderSettingsFromCookie(cookieHeader: string | null): Record<string, any> {
  const cookies = parseCookies(cookieHeader);
  const providersJson = cookies.providers;

  if (providersJson) {
    try {
      const parsed = JSON.parse(providersJson);

      // Ensure the parsed result is an object before casting
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        return parsed as Record<string, any>;
      }
    } catch (e) {
      /*
       * Log the error or handle it as appropriate for the application context.
       * For now, silently fail and return an empty object for malformed JSON.
       * console.error("Failed to parse providers cookie:", e);
       */
    }
  }

  return {};
}
