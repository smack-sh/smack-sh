const DEFAULT_GEMINI_MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';

type GeminiGenerateArgs = {
  systemPrompt: string;
  userPrompt: string;
  model?: string;
  temperature?: number;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

export async function generateGeminiText(args: GeminiGenerateArgs): Promise<string | null> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (!apiKey) {
    return null;
  }

  const model = args.model || DEFAULT_GEMINI_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = buildGeminiRequestBody(args);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GeminiGenerateResponse;
    const text = extractCandidateText(payload);

    return text || null;
  } catch (error) {
    console.error('Gemini generation failed:', error);
    return null;
  }
}

function buildGeminiRequestBody(args: GeminiGenerateArgs): string {
  const temperature = typeof args.temperature === 'number' ? args.temperature : 0.2;
  const systemPrompt = JSON.stringify(args.systemPrompt);
  const userPrompt = JSON.stringify(args.userPrompt);

  return (
    '{"systemInstruction":{"parts":[{"text":' +
    systemPrompt +
    '}]},"contents":[{"role":"user","parts":[{"text":' +
    userPrompt +
    '}]}],"generationConfig":{"temperature":' +
    String(temperature) +
    ',"maxOutputTokens":4096}}'
  );
}

function extractCandidateText(payload: GeminiGenerateResponse): string | null {
  if (!payload.candidates || payload.candidates.length === 0) {
    return null;
  }

  const first = payload.candidates[0];

  if (!first.content || !first.content.parts || first.content.parts.length === 0) {
    return null;
  }

  let combined = '';

  for (const part of first.content.parts) {
    combined += part.text || '';
  }

  const trimmed = combined.trim();
  return trimmed.length > 0 ? trimmed : null;
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
