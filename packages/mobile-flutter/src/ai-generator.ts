import type { FlutterAiProvider } from './types';

class MockFlutterAiProvider implements FlutterAiProvider {
  async generate(input: {
    systemPrompt: string;
    userPrompt: string;
    language: 'dart';
    includeImports?: boolean;
    stateLibrary?: 'riverpod';
  }): Promise<string> {
    const imports = input.includeImports
      ? `import 'package:flutter/material.dart';\nimport 'package:flutter_riverpod/flutter_riverpod.dart';\n`
      : '';
    return `${imports}\n// ${input.systemPrompt}\n// ${input.userPrompt}\n`;
  }
}

export class FlutterAIGenerator {
  private _ai: FlutterAiProvider;

  constructor(aiProvider: FlutterAiProvider = new MockFlutterAiProvider()) {
    this._ai = aiProvider;
  }

  async generateWidgetTree(description: string): Promise<string> {
    const dartCode = await this._ai.generate({
      systemPrompt: 'Generate Flutter widget tree with Material Design',
      userPrompt: description,
      language: 'dart',
      includeImports: true,
    });

    return this.formatDartCode(dartCode);
  }

  async generateStateManagement(screen: string): Promise<string> {
    return this._ai.generate({
      systemPrompt: 'Generate Riverpod state management for Flutter',
      userPrompt: `Screen: ${screen}`,
      language: 'dart',
      stateLibrary: 'riverpod',
    });
  }

  async adaptForPlatform(widgetCode: string): Promise<{ material: string; cupertino: string }> {
    const material = widgetCode;
    const cupertino = await this.convertToCupertino(widgetCode);
    return { material, cupertino };
  }

  private async convertToCupertino(widgetCode: string): Promise<string> {
    return widgetCode.replaceAll('MaterialApp', 'CupertinoApp').replaceAll('Scaffold', 'CupertinoPageScaffold');
  }

  private formatDartCode(code: string): string {
    return code.trim();
  }
}

