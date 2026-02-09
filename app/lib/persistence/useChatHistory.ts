import { useLoaderData, useNavigate, useSearchParams } from '@remix-run/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { atom } from 'nanostores';
import { generateId, type JSONValue, type Message } from 'ai';
import { toast } from 'react-toastify';
import { workbenchStore } from '~/lib/stores/workbench';
import { logStore } from '~/lib/stores/logs'; // Import logStore
import {
  getMessages,
  getNextId,
  getUrlId,
  openDatabase,
  setMessages,
  duplicateChat,
  createChatFromMessages,
  getSnapshot,
  setSnapshot,
  type IChatMetadata,
} from './db';
import type { FileMap } from '~/lib/stores/files';
import type { Snapshot } from './types';
import { webcontainer } from '~/lib/webcontainer';
import { detectProjectCommands, createCommandActionsString } from '~/utils/projectCommands';
import type { ContextAnnotation } from '~/types/context';

async function restoreSnapshot(id: string, snapshot: Snapshot | undefined, signal?: AbortSignal) {
  const container = await webcontainer;
  if (signal?.aborted) return;

  const validSnapshot = snapshot || { chatIndex: '', files: {} };
  if (!validSnapshot?.files) return;

  try {
    const folders = Object.entries(validSnapshot.files).filter(([, value]) => value?.type === 'folder');
    await Promise.all(
      folders.map(async ([key]) => {
        if (signal?.aborted) throw new Error('Aborted');
        let path = key;
        if (path.startsWith(container.workdir)) {
          path = path.replace(container.workdir, '');
        }
        await container.fs.mkdir(path, { recursive: true });
      }),
    );

    const files = Object.entries(validSnapshot.files).filter(([, value]) => value?.type === 'file');
    await Promise.all(
      files.map(async ([key, value]) => {
        if (signal?.aborted) throw new Error('Aborted');
        if (value?.type === 'file') {
          let path = key;
          if (path.startsWith(container.workdir)) {
            path = path.replace(container.workdir, '');
          }
          await container.fs.writeFile(path, value.content, { encoding: value.isBinary ? undefined : 'utf8' });
        }
      }),
    );
  } catch (error) {
    if ((error as Error).message !== 'Aborted') {
      console.error('Failed to restore snapshot:', error);
      toast.error('Failed to restore project files from snapshot.');
    }
  }
}

export interface ChatHistoryItem {
  id: string;
  urlId?: string;
  description?: string;
  messages: Message[];
  timestamp: string;
  metadata?: IChatMetadata;
}

const persistenceEnabled = !import.meta.env.VITE_DISABLE_PERSISTENCE;

export const db = persistenceEnabled ? await openDatabase() : undefined;

export const chatId = atom<string | undefined>(undefined);
export const description = atom<string | undefined>(undefined);
export const chatMetadata = atom<IChatMetadata | undefined>(undefined);
export function useChatHistory() {
  const navigate = useNavigate();
  const { id: mixedId } = useLoaderData<{ id?: string }>();
  const [searchParams] = useSearchParams();

  const [archivedMessages, setArchivedMessages] = useState<Message[]>([]);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState<boolean>(false);
  const [urlId, setUrlId] = useState<string | undefined>();
  const persistenceLock = useRef(false);
  const persistenceQueue = useRef<(() => Promise<void>)[]>([]);
  const chatIdLock = useRef(false);

  const processPersistenceQueue = useCallback(async () => {
    if (persistenceLock.current) return;
    const nextTask = persistenceQueue.current.shift();
    if (nextTask) {
      persistenceLock.current = true;
      try {
        await nextTask();
      } catch (error) {
        console.error('Error processing persistence queue:', error);
        toast.error('An error occurred while saving chat history.');
      } finally {
        persistenceLock.current = false;
        processPersistenceQueue();
      }
    }
  }, []);

  const allocateChatId = useCallback(async () => {
    if (chatIdLock.current || chatId.get()) return;
    chatIdLock.current = true;
    try {
      if (!db) throw new Error('Database not initialized');
      const nextId = await getNextId(db);
      chatId.set(nextId);
      if (!urlId) {
        navigateChat(nextId);
      }
      // Immediately update IndexedDB
      await setMessages(db, nextId, [], urlId, description.get(), undefined, chatMetadata.get());
    } catch (error) {
      console.error('Error allocating chat ID:', error);
      toast.error('Failed to create a new chat session.');
      // Rollback
      chatId.set(undefined);
    } finally {
      chatIdLock.current = false;
    }
  }, [urlId]);

  const takeSnapshot = useCallback(
    async (chatIdx: string, files: FileMap, _chatId?: string | undefined, chatSummary?: string) => {
      const id = chatId.get();
      if (!id || !db) return;

      const snapshot: Snapshot = { chatIndex: chatIdx, files, summary: chatSummary };
      try {
        await setSnapshot(db, id, snapshot);
      } catch (error) {
        console.error('Failed to save snapshot:', error);
        toast.error('Failed to save chat snapshot.');
      }
    },
    [],
  );

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    if (!db) {
      setReady(true);
      if (persistenceEnabled) {
        const error = new Error('Chat persistence is unavailable');
        logStore.logError('Chat persistence initialization failed', error);
        toast.error('Chat persistence is unavailable');
      }
      return;
    }

    if (mixedId) {
      Promise.all([getMessages(db, mixedId), getSnapshot(db, mixedId)])
        .then(async ([storedMessages, snapshot]) => {
          if (signal.aborted) return;
          if (storedMessages && storedMessages.messages.length > 0) {
            const validSnapshot = snapshot || { chatIndex: '', files: {} };
            const summary = validSnapshot.summary;
            const rewindId = searchParams.get('rewindTo');
            let startingIdx = -1;
            const endingIdx = rewindId
              ? storedMessages.messages.findIndex((m) => m.id === rewindId) + 1
              : storedMessages.messages.length;
            const snapshotIndex = storedMessages.messages.findIndex((m) => m.id === validSnapshot.chatIndex);

            if (snapshotIndex >= 0 && snapshotIndex < endingIdx) {
              startingIdx = snapshotIndex;
            }
            if (snapshotIndex > 0 && storedMessages.messages[snapshotIndex].id === rewindId) {
              startingIdx = -1;
            }

            let filteredMessages = storedMessages.messages.slice(startingIdx + 1, endingIdx);
            let archivedMessages: Message[] = [];
            if (startingIdx >= 0) {
              archivedMessages = storedMessages.messages.slice(0, startingIdx + 1);
            }
            setArchivedMessages(archivedMessages);

            if (startingIdx > 0) {
              const snapshotMessageId =
                storedMessages.messages[snapshotIndex]?.id || storedMessages.messages[0]?.id || generateId();
              await restoreSnapshot(mixedId, validSnapshot, signal);
              const files = Object.entries(validSnapshot?.files || {})
                .map(([key, value]) => (value?.type === 'file' ? { content: value.content, path: key } : null))
                .filter((x): x is { content: string; path: string } => !!x);
              const projectCommands = await detectProjectCommands(files);
              const commandActionsString = createCommandActionsString(projectCommands);

              filteredMessages = [
                {
                  id: generateId(),
                  role: 'user',
                  content: 'Restore project from snapshot',
                  annotations: ['no-store', 'hidden'],
                },
                {
                  id: snapshotMessageId,
                  role: 'assistant',
                  content: `smack Restored your chat from a snapshot. You can revert this message to load the full chat history.
                  <smackArtifact id="restored-project-setup" title="Restored Project & Setup" type="bundled">
                  ${Object.entries(snapshot?.files || {})
                    .map(([key, value]) =>
                      value?.type === 'file'
                        ? `<smackAction type="file" filePath="${key}">${value.content}</smackAction>`
                        : '',
                    )
                    .join('\n')}
                  ${commandActionsString}
                  </smackArtifact>`,
                  annotations: [
                    'no-store',
                    ...(summary
                      ? [{ chatId: snapshotMessageId, type: 'chatSummary', summary }]
                      : []),
                  ],
                },
                ...filteredMessages,
              ];
            }

            setInitialMessages(filteredMessages);
            setUrlId(storedMessages.urlId);
            description.set(storedMessages.description);
            chatId.set(storedMessages.id);
            chatMetadata.set(storedMessages.metadata);
          } else {
            navigate('/', { replace: true });
          }
          setReady(true);
        })
        .catch((error) => {
          if (!signal.aborted) {
            console.error(error);
            logStore.logError('Failed to load chat messages or snapshot', error);
            toast.error('Failed to load chat: ' + error.message);
          }
        });
    } else {
      setReady(true);
    }

    return () => {
      abortController.abort();
    };
  }, [mixedId, navigate, searchParams]);

  const storeMessageHistory = useCallback(
    async (messages: Message[]) => {
      const task = async () => {
        if (!db || messages.length === 0) return;

        const messagesToStore = messages.filter((m) => !m.annotations?.includes('no-store'));
        if (messagesToStore.length === 0) return;

        const { firstArtifact } = workbenchStore;
        let localUrlId = urlId;
        let localDescription = description.get();
        const localChatId = chatId.get();
        const localMetadata = chatMetadata.get();

        if (!localUrlId && firstArtifact?.id) {
          const newUrlId = await getUrlId(db, firstArtifact.id);
          localUrlId = newUrlId;
          navigateChat(newUrlId);
          setUrlId(newUrlId);
        }

        if (!localDescription && firstArtifact?.title) {
          localDescription = firstArtifact.title;
        }

        if (initialMessages.length === 0 && !localChatId) {
          await allocateChatId();
        }

        const finalChatId = chatId.get();
        if (!finalChatId) {
          throw new Error('Cannot save messages, chat ID is not set.');
        }

        const lastMessage = messagesToStore[messagesToStore.length - 1];
        let chatSummary: string | undefined;
        if (lastMessage.role === 'assistant' && lastMessage.annotations) {
          const annotations = lastMessage.annotations as JSONValue[];
          const summaryAnnotation = annotations.find(
            (a) => a && typeof a === 'object' && 'type' in a && a.type === 'chatSummary',
          ) as { summary?: string } | undefined;
          chatSummary = summaryAnnotation?.summary;
        }

        await takeSnapshot(lastMessage.id, workbenchStore.files.get(), localUrlId, chatSummary);

        try {
          await setMessages(db, finalChatId, [...archivedMessages, ...messagesToStore], localUrlId, localDescription, undefined, localMetadata);
          // Commit atom updates only on success
          description.set(localDescription);
          chatMetadata.set(localMetadata);
        } catch (error) {
          console.error('Failed to save messages:', error);
          toast.error('Failed to save chat history.');
          // No rollback needed for atoms as they were not set yet
        }
      };

      persistenceQueue.current.push(task);
      processPersistenceQueue();
    },
    [
      urlId,
      initialMessages.length,
      archivedMessages,
      allocateChatId,
      takeSnapshot,
      processPersistenceQueue,
    ],
  );

  return {
    ready: !mixedId || ready,
    initialMessages,
    updateChatMestaData: async (metadata: IChatMetadata) => {
      const id = chatId.get();
      if (!db || !id) return;

      const originalMetadata = chatMetadata.get();
      chatMetadata.set(metadata); // Optimistic update
      try {
        await setMessages(db, id, initialMessages, urlId, description.get(), undefined, metadata);
      } catch (error) {
        chatMetadata.set(originalMetadata); // Rollback
        toast.error('Failed to update chat metadata');
        console.error(error);
      }
    },
    storeMessageHistory,
    duplicateCurrentChat: async (listItemId: string) => {
      if (!db || (!mixedId && !listItemId)) return;
      try {
        const newId = await duplicateChat(db, mixedId || listItemId);
        navigate(`/chat/${newId}`);
        toast.success('Chat duplicated successfully');
      } catch (error) {
        toast.error('Failed to duplicate chat');
        console.error(error);
      }
    },
    importChat: async (description: string, messages: Message[], metadata?: IChatMetadata) => {
      if (!db) return;
      try {
        const newId = await createChatFromMessages(db, description, messages, metadata);
        window.location.href = `/chat/${newId}`;
        toast.success('Chat imported successfully');
      } catch (error) {
        toast.error(`Failed to import chat: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    exportChat: async (id = urlId) => {
      if (!db || !id) return;
      try {
        const chat = await getMessages(db, id);
        if (!chat) {
          toast.error('Chat not found for export.');
          return;
        }
        const chatData = {
          messages: chat.messages,
          description: chat.description,
          exportDate: new Date().toISOString(),
        };
        const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export chat:', error);
        toast.error('Failed to export chat.');
      }
    },
  };
}

function navigateChat(nextId: string) {
  /**
   * FIXME: Using the intended navigate function causes a rerender for <Chat /> that breaks the app.
   *
   * `navigate(`/chat/${nextId}`, { replace: true });`
   */
  const url = new URL(window.location.href);
  url.pathname = `/chat/${nextId}`;

  window.history.replaceState({}, '', url);
}
