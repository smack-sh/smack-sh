import { generateGeminiText } from '~/lib/builders/gemini.server';

export class FlutterAIGeneratorAdapter {
  async generateWidgetTree(description: string): Promise<string> {
    const generated = await generateGeminiText({
      systemPrompt: 'Generate Flutter widget tree code with Material Design and imports.',
      userPrompt: description,
    });

    return generated || `import 'package:flutter/material.dart';\n// ${description}\n`;
  }

  async generateStateManagement(screen: string): Promise<string> {
    const generated = await generateGeminiText({
      systemPrompt: 'Generate Riverpod state management code in Dart.',
      userPrompt: `Screen: ${screen}`,
    });

    return generated || `// Riverpod state for ${screen}`;
  }

  async adaptForPlatform(widgetCode: string): Promise<{ material: string; cupertino: string }> {
    return {
      material: widgetCode,
      cupertino: widgetCode.replaceAll('MaterialApp', 'CupertinoApp'),
    };
  }
}

export class FlutterBuildServiceAdapter {
  async buildAPK(projectId: string): Promise<{ url: string; jobId: string }> {
    const jobId = `job_${Date.now()}`;
    return {
      url: `https://example.invalid/flutter-artifacts/${projectId}/${jobId}/app-release.apk`,
      jobId,
    };
  }
}
