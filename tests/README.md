# Test Documentation

This directory contains all tests for the Smack application, organized into unit, integration, and end-to-end (E2E) categories.

## Structure

*   `tests/unit/`: Contains unit tests for individual functions, components, and modules.
*   `tests/integration/`: Contains integration tests that verify the interaction between multiple components or modules.
*   `tests/e2e/`: Contains end-to-end tests that simulate user interactions with the entire application.
*   `tests/setup.ts`: Global setup file for Vitest, including mocking global objects and custom matchers.
*   `tests/utils/`: Contains utility functions and mocks used across different test types.

## Running Tests

To run all tests:

```bash
pnpm test
```

To run tests in watch mode:

```bash
pnpm test:watch
```

## Test Utilities

The `tests/utils/` directory provides several helper modules for writing tests:

### `stream-mocks.ts`

Provides utilities for mocking streaming responses and the AI SDK.

*   `mockAiSdkUseChat(overrides?: Partial<ReturnType<typeof vi.fn>>)`: Mocks the `@ai-sdk/react` `useChat` hook.
*   `mockStreamingMessageParser(overrides?: Partial<any>)`: Mocks the `StreamingMessageParser` class.
*   `createMockMessage(content: string, role: 'user' | 'assistant' = 'user')`: Creates a mock `Message` object.
*   `createMockStreamingResponse(chunks: string[])`: Creates a mock `Response` object for streaming.

### `indexeddb-helpers.ts`

Provides utilities for mocking and interacting with IndexedDB for persistence tests.

*   `openTestDatabase()`: Opens a mock IndexedDB instance.
*   `clearTestDatabase()`: Clears all data from the mock IndexedDB.
*   `seedTestChat(db: IDBPDatabase, chat: ChatHistoryItem, snapshot?: Snapshot)`: Seeds the mock DB with chat data.
*   `getTestChat(db: IDBPDatabase, id: string)`: Retrieves a chat from the mock DB.
*   `getTestSnapshot(db: IDBPDatabase, id: string)`: Retrieves a snapshot from the mock DB.
*   `getTestCorruptedChat(db: IDBPDatabase, id: string)`: Retrieves a corrupted chat from the mock DB.
*   `createMockChatHistoryItem(...)`: Creates a mock `ChatHistoryItem` object.
*   `createMockSnapshot(...)`: Creates a mock `Snapshot` object.

### `electron-mocks.ts`

Provides utilities for mocking Electron-specific modules for desktop app tests.

*   `mockIpcRenderer()`: Mocks Electron's `ipcRenderer` for renderer process tests.
*   `mockIpcMain()`: Mocks Electron's `ipcMain` for main process tests.
*   `mockKeytar()`: Mocks the `keytar` module for secure credential storage.

### `desktop-builder-mocks.ts`

Provides utilities for mocking modules used by the desktop app builder.

*   `mockFsPromises()`: Mocks `fs/promises` to prevent actual file system operations.
*   `mockChildProcess()`: Mocks `child_process.exec` to simulate command execution.
*   `mockTemplates()`: Mocks the `templates` module to control template generation behavior.

## Global Setup (`tests/setup.ts`)

This file is automatically run by Vitest before all tests. It sets up global mocks and configurations:

*   Mocks `window.matchMedia` for consistent responsive component testing.
*   Mocks `URL.createObjectURL` and `URL.revokeObjectURL` for file handling.
*   Mocks `window.flutter_inappwebview` for mobile E2E tests to simulate Flutter platform channel communication.
*   Mocks `global.fetch` for network requests.
*   Clears all mocks before each test and restores them after each test to ensure test isolation.
```