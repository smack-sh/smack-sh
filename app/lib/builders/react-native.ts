import { generateGeminiText } from '~/lib/builders/gemini.server';

export class ReactNativeAIConverterAdapter {
  async convertWebToMobile(webReactCode: string): Promise<string> {
    const generated = await generateGeminiText({
      systemPrompt:
        'Convert web React JSX to React Native TSX. Replace div/span/className/onClick with View/Text/style/onPress.',
      userPrompt: webReactCode,
    });

    return (
      generated ||
      webReactCode
        .replaceAll('<div', '<View')
        .replaceAll('</div>', '</View>')
        .replaceAll('<span', '<Text')
        .replaceAll('</span>', '</Text>')
        .replaceAll('className', 'style')
        .replaceAll('onClick', 'onPress')
    );
  }

  async generateNativeBridge(feature: string): Promise<{ ios: string; android: string; js: string }> {
    const generated = await generateGeminiText({
      systemPrompt:
        'Generate JSON with keys ios, android, js containing Swift, Kotlin, and TypeScript React Native bridge code.',
      userPrompt: feature,
    });

    if (generated) {
      try {
        const parsed = JSON.parse(generated) as { ios?: string; android?: string; js?: string };

        if (parsed.ios && parsed.android && parsed.js) {
          return {
            ios: parsed.ios,
            android: parsed.android,
            js: parsed.js,
          };
        }
      } catch {
        // fallback below
      }
    }

    return {
      ios: `// swift bridge for ${feature}`,
      android: `// kotlin bridge for ${feature}`,
      js: `// typescript bridge for ${feature}`,
    };
  }
}
