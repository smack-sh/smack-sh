import DOMPurify from 'dompurify';

/**
 * HTML Sanitization Utility
 * Provides secure wrappers for rendering HTML content
 */

// Configure DOMPurify for server-side rendering
let purify: typeof DOMPurify;
let purifyInitialized = false;

async function initializePurify(): Promise<typeof DOMPurify> {
  if (purifyInitialized) {
    return purify;
  }

  if (typeof window === 'undefined') {
    // Server-side: create a JSDOM instance for DOMPurify
    const { JSDOM } = await import('jsdom');
    const window = new JSDOM('').window;
    purify = DOMPurify(window);
  } else {
    // Client-side: use the browser's window
    purify = DOMPurify;
  }
  
  purifyInitialized = true;
  return purify;
}

/**
 * Default configuration for DOMPurify
 * Restrictive by default, only allowing safe elements and attributes
 */
const defaultConfig = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'code',
    'pre',
    'span',
    'div',
    'a',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'style', 'target', 'rel', 'id', 'data-*'],
  ALLOW_DATA_ATTR: true,
  SANITIZE_DOM: true,
  KEEP_CONTENT: true,
  // Force all links to open in new tab with proper security
  ADD_ATTR: ['target="_blank"', 'rel="noopener noreferrer"'],
  // Block dangerous URLs
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout', 'onfocus', 'onblur'],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'textarea'],
};

/**
 * Configuration for code/syntax highlighting
 * Allows more elements needed for syntax highlighting
 */
const codeConfig = {
  ...defaultConfig,
  ALLOWED_TAGS: [
    ...defaultConfig.ALLOWED_TAGS,
    'span',
    'div',
    'code',
    'pre',
    'br',
    'line',
    'span',
  ],
};

/**
 * Sanitizes HTML content to prevent XSS attacks
 * @param html - The HTML content to sanitize
 * @param config - Optional custom DOMPurify configuration
 * @returns Sanitized HTML string
 */
export async function sanitizeHtml(html: string, config?: Record<string, unknown>): Promise<string> {
  if (!html) {
    return '';
  }

  try {
    const purifier = await initializePurify();
    return purifier.sanitize(html, config || defaultConfig) as string;
  } catch (error) {
    console.error('Error sanitizing HTML:', error);
    // Return escaped text as fallback
    return escapeHtml(html);
  }
}

/**
 * Sanitizes HTML specifically for code/syntax highlighting
 * @param html - The HTML content to sanitize
 * @returns Sanitized HTML string safe for code display
 */
export async function sanitizeCodeHtml(html: string): Promise<string> {
  return sanitizeHtml(html, codeConfig);
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this when you want to display raw HTML as text
 * @param text - The text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  if (!text) {
    return '';
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
  };

  return text.replace(/[&<>"'/`]/g, (char) => htmlEscapes[char] || char);
}

/**
 * Creates a sanitized HTML object for dangerouslySetInnerHTML
 * Use this instead of directly using dangerouslySetInnerHTML
 * @param html - The HTML content to sanitize
 * @param config - Optional custom DOMPurify configuration
 * @returns Object with __html property for React
 */
export async function createSanitizedHtml(html: string, config?: Record<string, unknown>): Promise<{ __html: string }> {
  return {
    __html: await sanitizeHtml(html, config),
  };
}

/**
 * Creates a sanitized HTML object for code/syntax highlighting
 * @param html - The HTML content to sanitize
 * @returns Object with __html property for React
 */
export async function createSanitizedCodeHtml(html: string): Promise<{ __html: string }> {
  return {
    __html: await sanitizeCodeHtml(html),
  };
}

/**
 * Validates if a URL is safe (not javascript: or data: protocol)
 * @param url - The URL to validate
 * @returns boolean indicating if URL is safe
 */
export function isSafeUrl(url: string): boolean {
  if (!url) {
    return false;
  }

  const unsafeProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const normalizedUrl = url.trim().toLowerCase();

  return !unsafeProtocols.some((protocol) => normalizedUrl.startsWith(protocol));
}

/**
 * Sanitizes a URL to ensure it's safe
 * @param url - The URL to sanitize
 * @returns Sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
  if (!url) {
    return '';
  }

  if (isSafeUrl(url)) {
    return url;
  }

  console.warn('Blocked potentially unsafe URL:', url);
  return '';
}

/**
 * Removes all HTML tags from a string
 * Useful for getting plain text from HTML
 * @param html - The HTML content
 * @returns Plain text without HTML tags
 */
export async function stripHtml(html: string): Promise<string> {
  if (!html) {
    return '';
  }

  try {
    const purifier = await initializePurify();
    return purifier.sanitize(html, { ALLOWED_TAGS: [] }) as string;
  } catch (error) {
    console.error('Error stripping HTML:', error);
    return html.replace(/<[^>]*>/g, '');
  }
}

export default {
  sanitizeHtml,
  sanitizeCodeHtml,
  escapeHtml,
  createSanitizedHtml,
  createSanitizedCodeHtml,
  isSafeUrl,
  sanitizeUrl,
  stripHtml,
};
