import type { DesktopAiProvider, TauriProject, TauriProjectTemplate } from './types';

const DEFAULT_TAURI_CONFIG = {
  '$schema': '../node_modules/@tauri-apps/cli/config.schema.json',
  productName: 'Smack Tauri App',
  version: '0.1.0',
  identifier: 'com.smack.generated',
  build: {
    beforeDevCommand: 'pnpm dev',
    beforeBuildCommand: 'pnpm build',
    frontendDist: '../build/client',
    devUrl: 'http://localhost:5173',
  },
  app: {
    withGlobalTauri: false,
    windows: [
      {
        title: 'Smack Generated Desktop App',
        width: 1280,
        height: 860,
        resizable: true,
      },
    ],
    security: {
      csp: null,
    },
  },
};

class MockAiProvider implements DesktopAiProvider {
  async generate(input: {
    systemPrompt: string;
    userPrompt: string;
    outputFormat?: 'json';
    language?: 'rust' | 'typescript' | 'json';
  }): Promise<string> {
    if (input.outputFormat === 'json') {
      return JSON.stringify(
        {
          ...DEFAULT_TAURI_CONFIG,
          productName: 'Smack Generated Tauri App',
        },
        null,
        2,
      );
    }

    if (input.language === 'rust') {
      return `
#[tauri::command]
pub async fn health_check() -> Result<String, String> {
  Ok("ok".to_string())
}
      `.trim();
    }

    return `// Generated output for: ${input.userPrompt}`;
  }
}

export class DesktopAIGenerator {
  private _ai: DesktopAiProvider;

  constructor(aiProvider: DesktopAiProvider = new MockAiProvider()) {
    this._ai = aiProvider;
  }

  async generateFromPrompt(prompt: string, template: TauriProjectTemplate = 'note-taking-app'): Promise<TauriProject> {
    const tauriConfigRaw = await this._ai.generate({
      systemPrompt: 'Generate Tauri app config from description',
      userPrompt: prompt,
      outputFormat: 'json',
    });
    const tauriConfig = JSON.parse(tauriConfigRaw) as Record<string, unknown>;

    const ipcHandlers = await this.generateIPCHandlers(prompt);
    const uiCode = await this.generateUI(prompt, template);

    return { tauriConfig, ipcHandlers, uiCode, template };
  }

  async generateIPCHandlers(requirements: string): Promise<string> {
    return this._ai.generate({
      systemPrompt: 'Generate Tauri IPC handlers in Rust',
      userPrompt: `Requirements: ${requirements}`,
      language: 'rust',
    });
  }

  async generateUI(requirements: string, template: TauriProjectTemplate): Promise<string> {
    return this._ai.generate({
      systemPrompt: 'Generate React UI for a Tauri app',
      userPrompt: `Template: ${template}. Requirements: ${requirements}`,
      language: 'typescript',
    });
  }
}

