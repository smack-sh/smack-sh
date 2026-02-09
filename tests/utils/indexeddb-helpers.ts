// tests/utils/indexeddb-helpers.ts
import { openDB, deleteDB, IDBPDatabase } from 'idb';
import { ChatHistoryItem } from '~/lib/persistence/useChatHistory';
import { Snapshot } from '~/lib/persistence/types';
import { Message } from 'ai';

const TEST_DB_NAME = 'TestDesktopAppBuilderDB';
const TEST_DB_VERSION = 3; // Match the version in db.ts
const CHATS_STORE = 'chats';
const SNAPSHOTS_STORE = 'snapshots';
const CORRUPTED_CHATS_STORE = 'corrupted_chats';

export async function openTestDatabase(): Promise<IDBPDatabase> {
  return openDB(TEST_DB_NAME, TEST_DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        db.createObjectStore(CHATS_STORE, { keyPath: 'id' });
        db.createObjectStore(SNAPSHOTS_STORE, { keyPath: 'id' });
      }
      if (oldVersion < 3) {
        // Add corrupted_chats store in version 3
        if (!db.objectStoreNames.contains(CORRUPTED_CHATS_STORE)) {
          db.createObjectStore(CORRUPTED_CHATS_STORE, { keyPath: 'id' });
        }
      }
    },
  });
}

export async function clearTestDatabase(): Promise<void> {
  await deleteDB(TEST_DB_NAME);
}

export async function seedTestChat(
  db: IDBPDatabase,
  chat: ChatHistoryItem,
  snapshot?: Snapshot,
): Promise<void> {
  const tx = db.transaction([CHATS_STORE, SNAPSHOTS_STORE], 'readwrite');
  await tx.objectStore(CHATS_STORE).put(chat);
  if (snapshot) {
    await tx.objectStore(SNAPSHOTS_STORE).put({ id: chat.id, ...snapshot });
  }
  await tx.done;
}

export async function getTestChat(db: IDBPDatabase, id: string): Promise<ChatHistoryItem | undefined> {
  return db.get(CHATS_STORE, id);
}

export async function getTestSnapshot(db: IDBPDatabase, id: string): Promise<Snapshot | undefined> {
  return db.get(SNAPSHOTS_STORE, id);
}

export async function getTestCorruptedChat(db: IDBPDatabase, id: string): Promise<any | undefined> {
  return db.get(CORRUPTED_CHATS_STORE, id);
}

export const createMockChatHistoryItem = (
  id: string,
  messages: Message[],
  description?: string,
  urlId?: string,
  metadata?: any,
): ChatHistoryItem => ({
  id,
  messages,
  description: description || `Chat ${id}`,
  urlId: urlId || `url-${id}`,
  timestamp: new Date().toISOString(),
  metadata: metadata || {},
});

export const createMockSnapshot = (
  chatIndex: string,
  files: { [key: string]: any },
  summary?: string,
): Snapshot => ({
  chatIndex,
  files,
  summary,
});
