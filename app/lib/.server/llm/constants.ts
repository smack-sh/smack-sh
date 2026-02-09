// Re-export shared constants
export { MAX_TOKENS, MAX_RESPONSE_SEGMENTS, IGNORE_PATTERNS, type FileMap, type File, type Folder } from '~/lib/llm/constants';

/*
 * Provider-specific default completion token limits
 * Used as fallbacks when model doesn't specify maxCompletionTokens
 */
export const PROVIDER_COMPLETION_LIMITS: Record<string, number> = {
  gemini: 4096,
  Github: 4096,
  Anthropic: 64000,
  Google: 8192,
  Cohere: 4000,
  DeepSeek: 8192,
  Groq: 8192,
  HuggingFace: 4096,
  Mistral: 8192,
  Ollama: 8192,
  OpenRouter: 8192,
  Perplexity: 8192,
  Together: 8192,
  xAI: 8192,
  LMStudio: 8192,
  geminiLike: 8192,
  AmazonBedrock: 8192,
  Hyperbolic: 8192,
};

export function isReasoningModel(modelName: string): boolean {
  const result = /^(o1|o3|gpt-5)/i.test(modelName);
  console.log(`REGEX TEST: "${modelName}" matches reasoning pattern: ${result}`);
  return result;
}