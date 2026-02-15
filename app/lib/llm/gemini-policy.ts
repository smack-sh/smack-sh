export const GEMINI_PROVIDER_NAME = 'Google';
export const GEMINI_DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';

export function enforceGeminiModel(model?: string): string {
  if (!model || !model.toLowerCase().includes('gemini')) {
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
