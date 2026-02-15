import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';

const DEFAULT_GEMINI_MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';

type GeminiGenerateArgs = {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
};

export async function generateGeminiText(args: GeminiGenerateArgs): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const google = createGoogleGenerativeAI({ apiKey });
    const result = await generateText({
      model: google(args.model || DEFAULT_GEMINI_MODEL),
      system: args.systemPrompt,
      prompt: args.userPrompt,
      temperature: typeof args.temperature === 'number' ? args.temperature : 0.2,
      maxTokens: 4096,
    });

    return result.text;
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return null;
  }
}

export function extractJsonObject(input: string): Record<string, unknown> | null {
  try {
    const direct = JSON.parse(input) as Record<string, unknown>;
    return direct;
  } catch {
    const match = input.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}
