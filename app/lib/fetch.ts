type CommonRequest = Omit<RequestInit, 'body'> & { body?: URLSearchParams };

export async function request(url: string, init?: CommonRequest) {
  const effectiveInit: RequestInit = { ...init };

  if (init?.body instanceof URLSearchParams) {
    effectiveInit.body = init.body.toString();

    const headers = new Headers(init.headers);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/x-www-form-urlencoded');
    }

    effectiveInit.headers = headers;
  }

  if (import.meta.env.DEV) {
    const nodeFetch = await import('node-fetch');
    const https = await import('node:https');

    const agent = url.startsWith('https') ? new https.Agent({ rejectUnauthorized: false }) : undefined;

    return nodeFetch.default(url, { ...effectiveInit, agent });
  }

  return fetch(url, effectiveInit);
}
