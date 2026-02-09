// tests/utils/desktop-builder-mocks.ts
import { vi } from 'vitest';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { templates } from '~/lib/desktop-builder/templates';

export const mockFsPromises = () => {
  vi.mock('fs/promises', () => ({
    mkdir: vi.fn(() => Promise.resolve()),
    writeFile: vi.fn(() => Promise.resolve()),
    access: vi.fn(() => Promise.reject({ code: 'ENOENT' })), // Default: directory does not exist
    readFile: vi.fn(() => Promise.resolve('mock file content')),
  }));
  return fs;
};

export const mockChildProcess = () => {
  vi.mock('child_process', () => ({
    exec: vi.fn((command, options, callback) => {
      if (command.includes('error')) {
        callback(new Error('Simulated build error'), '', 'Simulated stderr');
      } else {
        callback(null, `Simulated stdout for: ${command}`, '');
      }
    }),
  }));
  return exec;
};

export const mockTemplates = () => {
  const mockGenerate = vi.fn(() => Promise.resolve());
  vi.mock('~/lib/desktop-builder/templates', () => ({
    templates: [
      {
        name: 'Electron + React',
        description: 'A test Electron + React template',
        framework: 'electron',
        language: 'javascript',
        generate: mockGenerate,
      },
      {
        name: 'Tauri + React',
        description: 'A test Tauri + React template',
        framework: 'tauri',
        language: 'rust',
        generate: mockGenerate,
      },
      {
        name: 'Native macOS (Swift)',
        description: 'A test Swift template',
        framework: 'native',
        language: 'swift',
        generate: mockGenerate,
      },
      {
        name: 'Native Windows (C#)',
        description: 'A test C# template',
        framework: 'native',
        language: 'csharp',
        generate: mockGenerate,
      },
    ],
  }));
  return templates;
};
