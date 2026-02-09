// tests/integration/chat-streaming.spec.tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chat } from '~/components/chat/Chat.client'; // Assuming Chat.client is the entry point
import { useChat } from '@ai-sdk/react';
import { StreamingMessageParser } from '~/lib/runtime/message-parser';
import { toast } from 'react-toastify';
import { useChatHistory } from '~/lib/persistence';

// Mock AI SDK's useChat hook
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
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
  })),
}));

// Mock StreamingMessageParser
vi.mock('~/lib/runtime/message-parser', () => ({
  StreamingMessageParser: vi.fn(() => ({
    parse: vi.fn((messageId, input) => input), // Simple passthrough for testing
    reset: vi.fn(),
  })),
}));

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  ToastContainer: vi.fn(() => null), // Mock ToastContainer to avoid rendering issues
}));

// Mock nanostores
vi.mock('nanostores', () => ({
  atom: vi.fn((initialValue) => {
    let value = initialValue;
    const listeners = new Set();
    return {
      get: () => value,
      set: (newValue: any) => {
        value = newValue;
        listeners.forEach((l: any) => l(newValue));
      },
      subscribe: (listener: any) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    };
  }),
}));

// Mock useChatHistory
vi.mock('~/lib/persistence', () => ({
  useChatHistory: vi.fn(() => ({
    ready: true,
    initialMessages: [],
    storeMessageHistory: vi.fn(() => Promise.resolve()),
    importChat: vi.fn(() => Promise.resolve()),
    exportChat: vi.fn(),
  })),
  description: { get: vi.fn(() => 'Test Chat') },
}));

describe('Chat Streaming Integration Tests', () => {
  const mockUseChat = useChat as vi.Mock;
  const mockStreamingMessageParser = StreamingMessageParser as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseChat.mockReturnValue({
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
    });
    mockStreamingMessageParser.mockImplementation(() => ({
      parse: vi.fn((messageId, input) => input),
      reset: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display initial messages and allow sending new messages', async () => {
    const initialMessages = [{ id: '1', role: 'user', content: 'Initial user message' }];
    mockUseChat.mockReturnValueOnce({
      messages: initialMessages,
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
    });
    vi.mocked(useChatHistory).mockReturnValueOnce({
      ready: true,
      initialMessages: initialMessages,
      storeMessageHistory: vi.fn(() => Promise.resolve()),
      importChat: vi.fn(() => Promise.resolve()),
      exportChat: vi.fn(),
    });

    render(<Chat />);

    expect(screen.getByText('Initial user message')).toBeInTheDocument();

    const chatInput = screen.getByPlaceholderText(/What would you like to discuss?/i);
    await userEvent.type(chatInput, 'New message');
    expect(mockUseChat().handleInputChange).toHaveBeenCalled();

    const sendButton = screen.getByRole('button', { name: /send message/i });
    await userEvent.click(sendButton);
    expect(mockUseChat().sendMessage).toHaveBeenCalledWith(expect.anything(), 'New message');
  });

  it('should show loading state during streaming', async () => {
    mockUseChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test' }],
      isLoading: true,
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
    });

    render(<Chat />);

    expect(screen.getByRole('button', { name: /stop streaming/i })).toBeInTheDocument();
  });

  it('should handle mid-stream errors and allow retry', async () => {
    vi.useFakeTimers();
    const mockReload = vi.fn();
    mockUseChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test' }],
      isLoading: true,
      input: '',
      handleInputChange: vi.fn(),
      setInput: vi.fn(),
      stop: vi.fn(),
      append: vi.fn(),
      setMessages: vi.fn(),
      reload: mockReload,
      error: new Error('Simulated stream error'),
      data: undefined,
      addToolResult: vi.fn(),
    });

    render(<Chat />);

    // Simulate stream timeout
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(toast.info).toHaveBeenCalledWith(expect.stringContaining('Connection issue. Retrying in 1s... (Attempt 1)'));
    });

    act(() => {
      vi.advanceTimersByTime(1000); // Advance for first retry
    });

    await waitFor(() => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });

    // Simulate error after retries
    mockUseChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test' }],
      isLoading: false,
      input: '',
      handleInputChange: vi.fn(),
      setInput: vi.fn(),
      stop: vi.fn(),
      append: vi.fn(),
      setMessages: vi.fn(),
      reload: mockReload,
      error: new Error('Final simulated stream error'),
      data: undefined,
      addToolResult: vi.fn(),
    });

    act(() => {
      vi.advanceTimersByTime(10000); // Advance past max retries
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Final simulated stream error'));
      expect(screen.getByText(/An unexpected error occurred/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    expect(mockReload).toHaveBeenCalledTimes(2);
  });

  it('should handle malformed chunks gracefully', async () => {
    const mockParse = vi.fn((messageId, input) => {
      if (input.includes('malformed')) {
        throw new Error('Malformed chunk');
      }
      return input;
    });
    mockStreamingMessageParser.mockImplementation(() => ({
      parse: mockParse,
      reset: vi.fn(),
    }));

    mockUseChat.mockReturnValue({
      messages: [{ id: '1', role: 'user', content: 'Test' }],
      isLoading: true,
      input: '',
      handleInputChange: vi.fn(),
      setInput: vi.fn(),
      stop: vi.fn(),
      append: vi.fn((message) => {
        if (message.content.includes('malformed')) {
          throw new Error('Simulated append error due to malformed content');
        }
      }),
      setMessages: vi.fn(),
      reload: vi.fn(),
      error: undefined,
      data: undefined,
      addToolResult: vi.fn(),
    });

    render(<Chat />);

    // Simulate receiving a malformed chunk
    act(() => {
      mockUseChat().append({ id: '2', role: 'assistant', content: 'partial malformed chunk' });
    });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Simulated append error due to malformed content'));
    });
  });
});
