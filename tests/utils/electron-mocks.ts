// tests/utils/electron-mocks.ts
import { vi } from 'vitest';

export const mockIpcRenderer = () => {
  const ipcRenderer = {
    on: vi.fn(),
    once: vi.fn(),
    send: vi.fn(),
    sendSync: vi.fn(),
    invoke: vi.fn(),
    removeListener: vi.fn(),
    removeAllListeners: vi.fn(),
  };

  Object.defineProperty(window, 'ipcRenderer', {
    value: ipcRenderer,
    writable: true,
    configurable: true,
  });

  return ipcRenderer;
};

export const mockIpcMain = () => {
  const ipcMain = {
    on: vi.fn(),
    once: vi.fn(),
    handle: vi.fn(),
    removeHandler: vi.fn(),
    removeAllHandlers: vi.fn(),
  };

  // In a Node.js environment (like Vitest for main process tests),
  // we can directly mock the module.
  // For renderer process tests, this mock won't be directly accessible
  // unless the test environment is configured to expose it.
  // This is primarily for main process testing.
  return ipcMain;
};

// Mock keytar for Electron main process tests
export const mockKeytar = () => {
  const keytar = {
    getPassword: vi.fn(() => Promise.resolve(null)),
    setPassword: vi.fn(() => Promise.resolve()),
    deletePassword: vi.fn(() => Promise.resolve()),
  };

  vi.mock('keytar', () => keytar);
  return keytar;
};
