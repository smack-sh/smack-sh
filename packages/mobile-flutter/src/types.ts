export type FlutterAiProvider = {
  generate: (input: {
    systemPrompt: string;
    userPrompt: string;
    language: 'dart';
    includeImports?: boolean;
    stateLibrary?: 'riverpod';
  }) => Promise<string>;
};

