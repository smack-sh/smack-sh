import type { ReactNativeAiProvider } from './types';

class MockReactNativeAiProvider implements ReactNativeAiProvider {
  async transform(input: {
    code: string;
    transformations: Array<{ from: string; to: string }>;
    outputFramework: 'react-native';
  }): Promise<string> {
    return input.transformations.reduce((acc, rule) => acc.replaceAll(rule.from, rule.to), input.code);
  }

  async generate(input: {
    prompt: string;
    language: 'swift' | 'kotlin' | 'typescript';
    framework?: 'react-native';
  }): Promise<string> {
    return `// ${input.language} bridge generated for: ${input.prompt}`;
  }
}

export class ReactNativeAIConverter {
  private _ai: ReactNativeAiProvider;

  constructor(aiProvider: ReactNativeAiProvider = new MockReactNativeAiProvider()) {
    this._ai = aiProvider;
  }

  async convertWebToMobile(webReactCode: string): Promise<string> {
    const mobileCode = await this._ai.transform({
      code: webReactCode,
      transformations: [
        { from: '<div', to: '<View' },
        { from: '</div>', to: '</View>' },
        { from: '<span', to: '<Text' },
        { from: '</span>', to: '</Text>' },
        { from: 'className', to: 'style' },
        { from: 'onClick', to: 'onPress' },
      ],
      outputFramework: 'react-native',
    });

    return this.addStyleSheet(mobileCode);
  }

  async generateNativeBridge(feature: string): Promise<{ ios: string; android: string; js: string }> {
    return {
      ios: await this._ai.generate({ prompt: feature, language: 'swift' }),
      android: await this._ai.generate({ prompt: feature, language: 'kotlin' }),
      js: await this._ai.generate({ prompt: feature, language: 'typescript', framework: 'react-native' }),
    };
  }

  private addStyleSheet(code: string): string {
    return `${code}\n\nconst styles = {};`;
  }
}

