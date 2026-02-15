import type { TauriProjectTemplate } from './types';

export const DESKTOP_TEMPLATES: Array<{ id: TauriProjectTemplate; label: string; description: string }> = [
  {
    id: 'note-taking-app',
    label: 'Note Taking App',
    description: 'Local-first notes with markdown preview and search.',
  },
  {
    id: 'productivity-timer',
    label: 'Productivity Timer',
    description: 'Pomodoro timer with system tray and desktop notifications.',
  },
  {
    id: 'system-monitor',
    label: 'System Monitor',
    description: 'CPU, memory and process metrics dashboard with alerts.',
  },
  {
    id: 'markdown-editor',
    label: 'Markdown Editor',
    description: 'Split-pane markdown editor with local file access.',
  },
  {
    id: 'password-manager',
    label: 'Password Manager',
    description: 'Encrypted credential vault with native keychain hooks.',
  },
];

