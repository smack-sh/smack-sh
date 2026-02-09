// app/lib/persistence/useChatHistory.spec.ts
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { useChatHistory, db, chatId, description, chatMetadata } from './useChatHistory';
import { openDatabase, setMessages, getMessages, getNextId, setSnapshot, getSnapshot, clearAllStores, createChatFromMessages, duplicateChat } from './db';
import { IDBPDatabase } from 'idb';
import { Message } from 'ai';
import { FileMap } from '~/lib/stores/files';
import { workbenchStore } from '~/lib/stores/workbench';
import { toast } from 'react-toastify';
import { webcontainer } from '~/lib/webcontainer';

// Mock IndexedDB using fake-indexeddb
import 'fake-indexeddb/auto';

// Mock Remix hooks and nanostores atoms
vi.mock('@remix-run/react', () => ({
  useLoaderData: vi.fn(() => ({})),
  useNavigate: vi.fn(() => vi.fn()),
  useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
}));

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

vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('~/lib/stores/workbench', () => ({
  workbenchStore: {
    firstArtifact: undefined,
    files: {
      get: vi.fn(() => ({})),
    },
    setReloadedMessages: vi.fn(),
  },
}));

vi.mock('~/lib/webcontainer', () => ({
  webcontainer: Promise.resolve({
    fs: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
    },
    workdir: '/workspace',
  }),
}));

// Mock db functions
vi.mock('./db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db')>();
  let mockDb: IDBPDatabase;
  let messagesStore: Record<string, any> = {};
  let snapshotStore: Record<string, any> = {};
  let nextIdCounter = 1;

  return {
    ...actual,
    openDatabase: vi.fn(async () => {
      if (!mockDb) {
        mockDb = await actual.openDatabase(); // Use actual openDatabase to get a real IDBPDatabase instance
        // Clear stores for each test run
        await clearAllStores(mockDb);
      }
      return mockDb;
    }),
    clearAllStores: vi.fn(async (dbInstance) => {
      messagesStore = {};
      snapshotStore = {};
      nextIdCounter = 1;
      // Clear actual IndexedDB stores if needed for full isolation
      const tx = dbInstance.transaction(['chats', 'snapshots', 'corrupted_chats'], 'readwrite');
      await Promise.all([
        tx.objectStore('chats').clear(),
        tx.objectStore('snapshots').clear(),
        tx.objectStore('corrupted_chats').clear(),
      ]);
      await tx.done;
    }),
    setMessages: vi.fn(async (dbInstance, id, messages, urlId, description, metadata) => {
      messagesStore[id] = { id, messages, urlId, description, metadata };
    }),
    getMessages: vi.fn(async (dbInstance, id) => messagesStore[id]),
    getNextId: vi.fn(async () => `chat-${nextIdCounter++}`),
    setSnapshot: vi.fn(async (dbInstance, id, snapshot) => {
      snapshotStore[id] = snapshot;
    }),
    getSnapshot: vi.fn(async (dbInstance, id) => snapshotStore[id]),
    getUrlId: vi.fn(async (dbInstance, artifactId) => `url-${artifactId}`),
    createChatFromMessages: vi.fn(async (dbInstance, description, messages, metadata) => {
      const newId = `chat-${nextIdCounter++}`;
      messagesStore[newId] = { id: newId, messages, description, metadata };
      return newId;
    }),
    duplicateChat: vi.fn(async (dbInstance, id) => {
      const originalChat = messagesStore[id];
      if (!originalChat) throw new Error('Chat not found');
      const newId = `chat-${nextIdCounter++}`;
      messagesStore[newId] = { ...originalChat, id: newId, urlId: `url-${newId}` };
      return newId;
    }),
  };
});

describe('useChatHistory', () => {
  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    // Ensure db is initialized and cleared
    await db; // Await the promise from the mocked openDatabase
    await clearAllStores(db as any); // Use the mocked clearAllStores
    chatId.set(undefined);
    description.set(undefined);
    chatMetadata.set(undefined);
  });

  afterEach(() => {
    // Clean up any lingering state or timers
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with no messages if no mixedId is provided', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate();

    expect(result.current.ready).toBe(true);
    expect(result.current.initialMessages).toEqual([]);
    expect(chatId.get()).toBeUndefined();
  });

  it('should allocate a new chat ID if no mixedId and no existing chatId', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate(); // Initial setup
    await act(async () => {
      await result.current.storeMessageHistory([{ id: 'm1', role: 'user', content: 'test' }]);
    });
    await waitForNextUpdate(); // For persistence queue processing

    expect(chatId.get()).toBe('chat-1');
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should load existing chat messages and snapshot if mixedId is provided', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    const mockSnapshot = { chatIndex: 'm1', files: { '/file.txt': { type: 'file', content: 'test' } } };

    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'existing-chat',
      messages: mockMessages,
      urlId: 'url-existing',
      description: 'Existing Chat',
      metadata: { foo: 'bar' },
    });
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(mockSnapshot);
    (vi.mocked(webcontainer) as any).fs.mkdir.mockResolvedValueOnce(undefined);
    (vi.mocked(webcontainer) as any).fs.writeFile.mockResolvedValueOnce(undefined);

    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'existing-chat' });

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate();

    expect(result.current.ready).toBe(true);
    expect(result.current.initialMessages).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: 'Restore project from snapshot' }),
      expect.objectContaining({ content: expect.stringContaining('smack Restored your chat from a snapshot.') }),
      expect.objectContaining({ id: 'm1', role: 'user', content: 'hello' }),
    ]));
    expect(chatId.get()).toBe('existing-chat');
    expect(description.get()).toBe('Existing Chat');
    expect(chatMetadata.get()).toEqual({ foo: 'bar' });
    expect(webcontainer.fs.writeFile).toHaveBeenCalledWith('/file.txt', 'test', { encoding: 'utf8' });
  });

  it('should handle concurrent storeMessageHistory calls without race conditions', async () => {
    vi.useFakeTimers();
    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate(); // Initial setup

    // Simulate rapid calls
    const message1: Message = { id: 'm1', role: 'user', content: 'first' };
    const message2: Message = { id: 'm2', role: 'assistant', content: 'second' };

    act(() => {
      result.current.storeMessageHistory([message1]);
      result.current.storeMessageHistory([message1, message2]);
    });

    // Advance timers to allow queue processing
    await act(async () => {
      vi.advanceTimersByTime(100); // Allow first task to start
      await Promise.resolve(); // Allow microtasks to run
      vi.advanceTimersByTime(100); // Allow second task to start
      await Promise.resolve(); // Allow microtasks to run
    });

    // Expect messages to be stored in sequence
    expect(setMessages).toHaveBeenCalledTimes(2);
    expect(setMessages).toHaveBeenCalledWith(expect.anything(), 'chat-1', [message1], undefined, undefined, undefined, undefined);
    expect(setMessages).toHaveBeenCalledWith(expect.anything(), 'chat-1', [message1, message2], undefined, undefined, undefined, undefined);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should handle chat ID allocation conflicts gracefully', async () => {
    vi.mocked(getNextId).mockImplementationOnce(async () => {
      // Simulate a delay or conflict
      await new Promise(resolve => setTimeout(resolve, 50));
      return 'chat-conflict';
    });

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate(); // Initial setup

    act(() => {
      result.current.storeMessageHistory([{ id: 'm1', role: 'user', content: 'test' }]);
    });

    await waitForNextUpdate(); // For persistence queue processing

    expect(chatId.get()).toBe('chat-1'); // Should eventually get a valid ID
    expect(toast.error).not.toHaveBeenCalled(); // No error should be shown for internal conflict resolution
  });

  it('should restore snapshot with missing data gracefully', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    const mockSnapshot = { chatIndex: 'm1', files: { '/file.txt': { type: 'file', content: 'test' } } };

    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'existing-chat',
      messages: mockMessages,
      urlId: 'url-existing',
      description: 'Existing Chat',
      metadata: { foo: 'bar' },
    });
    // Simulate missing snapshot
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(undefined);
    (vi.mocked(webcontainer) as any).fs.mkdir.mockResolvedValueOnce(undefined);
    (vi.mocked(webcontainer) as any).fs.writeFile.mockResolvedValueOnce(undefined);

    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'existing-chat' });

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate();

    expect(result.current.ready).toBe(true);
    expect(result.current.initialMessages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'm1', role: 'user', content: 'hello' }),
    ]));
    expect(webcontainer.fs.writeFile).not.toHaveBeenCalled(); // No files to write from snapshot
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should handle malformed snapshot data gracefully', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    // Simulate malformed snapshot (e.g., files is not an object)
    const malformedSnapshot = { chatIndex: 'm1', files: 'invalid' };

    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'existing-chat',
      messages: mockMessages,
      urlId: 'url-existing',
      description: 'Existing Chat',
      metadata: { foo: 'bar' },
    });
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(malformedSnapshot);
    (vi.mocked(webcontainer) as any).fs.mkdir.mockResolvedValueOnce(undefined);
    (vi.mocked(webcontainer) as any).fs.writeFile.mockResolvedValueOnce(undefined);

    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'existing-chat' });

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());

    await waitForNextUpdate();

    expect(result.current.ready).toBe(true);
    expect(result.current.initialMessages).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'm1', role: 'user', content: 'hello' }),
    ]));
    expect(webcontainer.fs.writeFile).not.toHaveBeenCalled(); // No files to write from snapshot
    expect(toast.error).toHaveBeenCalledWith('Failed to restore project files from snapshot.');
  });

  it('should update chat metadata correctly', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'existing-chat' });
    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'existing-chat',
      messages: mockMessages,
      urlId: 'url-existing',
      description: 'Existing Chat',
      metadata: { foo: 'bar' },
    });
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());
    await waitForNextUpdate();

    const newMetadata = { newKey: 'newValue' };
    await act(async () => {
      await result.current.updateChatMestaData(newMetadata);
    });

    expect(chatMetadata.get()).toEqual(newMetadata);
    expect(setMessages).toHaveBeenCalledWith(
      expect.anything(),
      'existing-chat',
      mockMessages,
      'url-existing',
      'Existing Chat',
      undefined,
      newMetadata
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should rollback metadata update on error', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'existing-chat' });
    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'existing-chat',
      messages: mockMessages,
      urlId: 'url-existing',
      description: 'Existing Chat',
      metadata: { foo: 'bar' },
    });
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());
    await waitForNextUpdate();

    const originalMetadata = chatMetadata.get();
    const newMetadata = { newKey: 'newValue' };

    vi.mocked(setMessages).mockRejectedValueOnce(new Error('DB write error'));

    await act(async () => {
      await result.current.updateChatMestaData(newMetadata);
    });

    expect(chatMetadata.get()).toEqual(originalMetadata); // Should rollback
    expect(toast.error).toHaveBeenCalledWith('Failed to update chat metadata');
  });

  it('should duplicate chat correctly', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'hello' }];
    vi.mocked(useLoaderData).mockReturnValueOnce({ id: 'chat-to-duplicate' });
    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: 'chat-to-duplicate',
      messages: mockMessages,
      urlId: 'url-original',
      description: 'Original Chat',
      metadata: { foo: 'bar' },
    });
    (vi.mocked(getSnapshot) as any).mockResolvedValueOnce(undefined);

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());
    await waitForNextUpdate();

    const navigate = vi.mocked(useNavigate());
    await act(async () => {
      await result.current.duplicateCurrentChat('chat-to-duplicate');
    });

    expect(duplicateChat).toHaveBeenCalledWith(expect.anything(), 'chat-to-duplicate');
    expect(navigate).toHaveBeenCalledWith('/chat/chat-2'); // Assuming nextIdCounter is 2
    expect(toast.success).toHaveBeenCalledWith('Chat duplicated successfully');
  });

  it('should import chat correctly', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'imported' }];
    const mockDescription = 'Imported Chat';
    const mockMetadata = { source: 'import' };

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());
    await waitForNextUpdate();

    await act(async () => {
      await result.current.importChat(mockDescription, mockMessages, mockMetadata);
    });

    expect(createChatFromMessages).toHaveBeenCalledWith(
      expect.anything(),
      mockDescription,
      mockMessages,
      mockMetadata
    );
    expect(toast.success).toHaveBeenCalledWith('Chat imported successfully');
    // Cannot directly test window.location.href change in JSDOM, but can check if it was attempted
    // expect(window.location.href).toContain('/chat/chat-1'); // Assuming nextIdCounter is 1
  });

  it('should export chat correctly', async () => {
    const mockMessages: Message[] = [{ id: 'm1', role: 'user', content: 'exportable' }];
    const mockDescription = 'Exportable Chat';
    const mockChatId = 'export-chat-id';

    (vi.mocked(getMessages) as any).mockResolvedValueOnce({
      id: mockChatId,
      messages: mockMessages,
      description: mockDescription,
    });

    const { result, waitForNextUpdate } = renderHook(() => useChatHistory());
    await waitForNextUpdate();

    // Mock URL.createObjectURL and document.createElement('a')
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');
    const clickSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: clickSpy,
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tagName);
    });

    await act(async () => {
      await result.current.exportChat(mockChatId);
    });

    expect(getMessages).toHaveBeenCalledWith(expect.anything(), mockChatId);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
