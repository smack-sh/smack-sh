import createDOMPurify from 'dompurify';

let purifier: ReturnType<typeof createDOMPurify> | null = null;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getPurifier() {
  if (typeof window === 'undefined' || !window.document) {
    return null;
  }

  if (!purifier) {
    purifier = createDOMPurify(window);
  }

  return purifier;
}

export function sanitizeHtml(html: string): string {
  if (!html) {
    return '';
  }

  const domPurify = getPurifier();

  if (!domPurify) {
    // Server-side fallback to prevent rendering unsafe markup.
    return escapeHtml(html);
  }

  return domPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'style'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
  });
}
