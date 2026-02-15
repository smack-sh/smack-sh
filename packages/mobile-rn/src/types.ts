export type ReactNativeAiProvider = {
  transform: (input: {
    code: string;
    transformations: Array<{ from: string; to: string }>;
    outputFramework: 'react-native';
  }) => Promise<string>;
  generate: (input: { prompt: string; language: 'swift' | 'kotlin' | 'typescript'; framework?: 'react-native' }) => Promise<string>;
};

