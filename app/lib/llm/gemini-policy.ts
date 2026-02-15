export const GEMINI_PROVIDER_NAME = 'Google';

const FALLBACK_GEMINI_MODEL = 'gemini-3.0-flash';

function isGeminiModel(value?: string): value is string {
  if (!value) {
    return false;
  }

  return value.trim().toLowerCase().startsWith('gemini');
}

export const GEMINI_DEFAULT_MODEL = isGeminiModel(process.env.DEFAULT_MODEL)
  ? process.env.DEFAULT_MODEL
  : FALLBACK_GEMINI_MODEL;

export function enforceGeminiModel(model?: string): string {
  if (!isGeminiModel(model)) {
    return GEMINI_DEFAULT_MODEL;
  }

  return model;
}

export function enforceGeminiProvider(providerName?: string): string {
  if (!providerName || providerName !== GEMINI_PROVIDER_NAME) {
    return GEMINI_PROVIDER_NAME;
  }

  return providerName;
}
