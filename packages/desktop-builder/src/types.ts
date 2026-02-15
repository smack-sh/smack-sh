export type TauriProjectTemplate =
  | 'note-taking-app'
  | 'productivity-timer'
  | 'system-monitor'
  | 'markdown-editor'
  | 'password-manager';

export type TauriProject = {
  tauriConfig: Record<string, unknown>;
  ipcHandlers: string;
  uiCode: string;
  template: TauriProjectTemplate;
};

export type DesktopAiProvider = {
  generate: (input: {
    systemPrompt: string;
    userPrompt: string;
    outputFormat?: 'json';
    language?: 'rust' | 'typescript' | 'json';
  }) => Promise<string>;
};

