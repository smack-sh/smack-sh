// tests/utils/stream-mocks.ts
import { vi } from 'vitest';
import type { Message } from 'ai';

export const mockAiSdkUseChat = (overrides?: Partial<ReturnType<typeof vi.fn>>) => {
  return vi.fn(() => ({
    messages: [],
    isLoading: false,
    input: '',
    handleInputChange: vi.fn(),
    setInput: vi.fn(),
    stop: vi.fn(),
    append: vi.fn(),
    setMessages: vi.fn(),
    reload: vi.fn(),
    error: undefined,
    data: undefined,
    addToolResult: vi.fn(),
    ...overrides,
  }));
};

export const mockStreamingMessageParser = (overrides?: Partial<any>) => {
  return vi.fn(() => ({
    parse: vi.fn((messageId, input) => input), // Default passthrough
    reset: vi.fn(),
    ...overrides,
  }));
};

export const createMockMessage = (content: string, role: 'user' | 'assistant' = 'user'): Message => ({
  id: Math.random().toString(36).substring(7),
  role,
  content,
});

export const createMockStreamingResponse = async (chunks: string[]): Promise<Response> => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        await new Promise(resolve => setTimeout(resolve, 10)); // Simulate stream delay
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' },
  });
};
