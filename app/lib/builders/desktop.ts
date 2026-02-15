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

export class DesktopAIGeneratorAdapter {
  async generateFromPrompt(prompt: string, template: TauriProjectTemplate = 'note-taking-app'): Promise<TauriProject> {
    const generatedConfig = await generateGeminiText({
      systemPrompt: 'Generate valid JSON Tauri config object.',
      userPrompt: `Create tauri config JSON for template ${template}. Requirements: ${prompt}`,
    });
    const parsedConfig = generatedConfig ? extractJsonObject(generatedConfig) : null;
    const generatedIpc = await generateGeminiText({
      systemPrompt: 'Generate Rust Tauri command handlers.',
      userPrompt: `Generate IPC handlers for: ${prompt}`,
    });
    const generatedUi = await generateGeminiText({
      systemPrompt: 'Generate TypeScript React UI code for Tauri app.',
      userPrompt: `Template ${template}. Requirements: ${prompt}`,
    });

    return {
      tauriConfig: parsedConfig || {
        productName: 'Smack Generated Tauri App',
        identifier: 'com.smack.generated',
      },
      ipcHandlers: generatedIpc || `// Rust IPC handlers for: ${prompt}`,
      uiCode: generatedUi || `// Tauri UI generated for template ${template}`,
      template,
    };
  }
}
import { extractJsonObject, generateGeminiText } from '~/lib/builders/gemini.server';
