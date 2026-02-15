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
  const body = {
    systemInstruction: {
      parts: [{ text: args.systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: args.userPrompt }],
      },
    ],
    generationConfig: {
      temperature: typeof args.temperature === 'number' ? args.temperature : 0.2,
      maxOutputTokens: 4096,
    },
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as GeminiGenerateResponse;
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();

    return text || null;
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
