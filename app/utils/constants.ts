import type { Template } from '~/types/template';
import type { ProviderInfo } from '~/types/model';

export const WORK_DIR_NAME = 'project';
export const WORK_DIR = `/home/${WORK_DIR_NAME}`;
export const MODIFICATIONS_TAG_NAME = 'smack_file_modifications';
export const MODEL_REGEX = /^\[Model: (.*?)\]\n\n/;
export const PROVIDER_REGEX = /\[Provider: (.*?)\]\n\n/;
export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gemini-2.0-flash';
export const PROMPT_COOKIE_KEY = 'cachedPrompt';
export const TOOL_EXECUTION_APPROVAL = {
  APPROVE: 'Yes, approved.',
  REJECT: 'No, rejected.',
} as const;
export const TOOL_NO_EXECUTE_FUNCTION = 'Error: No execute function found on tool';
export const TOOL_EXECUTION_DENIED = 'Error: User denied access to tool execution';
export const TOOL_EXECUTION_ERROR = 'Error: An error occured while calling tool';

/*
 * Provider list will be loaded from API in client builds
 * Static fallback for build-time safety - matches what LLMManager would provide
 */
const FALLBACK_PROVIDER_LIST: ProviderInfo[] = [
  {
    name: 'Google',
    staticModels: [],
    config: { baseUrlKey: 'GEMINI_LIKE_API_BASE_URL', apiTokenKey: 'GEMINI_LIKE_API_KEY' },
    getApiKeyLink: 'https://aistudio.google.com/app/apikey',
    getModelInstance: () => {
      throw new Error('Not implemented in client');
    },
  } as ProviderInfo,
];

/*
 * For Electron/client builds, use static fallback
 * Providers will be loaded dynamically from API routes
 */
export const PROVIDER_LIST: ProviderInfo[] = FALLBACK_PROVIDER_LIST;
export const DEFAULT_PROVIDER: ProviderInfo = FALLBACK_PROVIDER_LIST[0];

export const providerBaseUrlEnvKeys: Record<string, { baseUrlKey?: string; apiTokenKey?: string }> = {};
PROVIDER_LIST.forEach((provider) => {
  providerBaseUrlEnvKeys[provider.name] = {
    baseUrlKey: provider.config.baseUrlKey,
    apiTokenKey: provider.config.apiTokenKey,
  };
});

// starter Templates

export const STARTER_TEMPLATES: Template[] = [
  {
    name: 'Expo App',
    label: 'Expo App',
    description: 'Expo starter template for building cross-platform mobile apps',
    githubRepo: 'xKevIsDev/smack-expo-template',
    tags: ['mobile', 'expo', 'mobile-app', 'android', 'iphone'],
    icon: 'i-smack:expo',
  },
  {
    name: 'Basic Astro',
    label: 'Astro Basic',
    description: 'Lightweight Astro starter template for building fast static websites',
    githubRepo: 'xKevIsDev/smack-astro-basic-template',
    tags: ['astro', 'blog', 'performance'],
    icon: 'i-smack:astro',
  },
  {
    name: 'NextJS Shadcn',
    label: 'Next.js with shadcn/ui',
    description: 'Next.js starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'xKevIsDev/smack-nextjs-shadcn-template',
    tags: ['nextjs', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-smack:nextjs',
  },
  {
    name: 'Vite Shadcn',
    label: 'Vite with shadcn/ui',
    description: 'Vite starter fullstack template integrated with shadcn/ui components and styling system',
    githubRepo: 'xKevIsDev/vite-shadcn',
    tags: ['vite', 'react', 'typescript', 'shadcn', 'tailwind'],
    icon: 'i-smack:shadcn',
  },
  {
    name: 'Qwik Typescript',
    label: 'Qwik TypeScript',
    description: 'Qwik framework starter with TypeScript for building resumable applications',
    githubRepo: 'xKevIsDev/smack-qwik-ts-template',
    tags: ['qwik', 'typescript', 'performance', 'resumable'],
    icon: 'i-smack:qwik',
  },
  {
    name: 'Remix Typescript',
    label: 'Remix TypeScript',
    description: 'Remix framework starter with TypeScript for full-stack web applications',
    githubRepo: 'xKevIsDev/smack-remix-ts-template',
    tags: ['remix', 'typescript', 'fullstack', 'react'],
    icon: 'i-smack:remix',
  },
  {
    name: 'Slidev',
    label: 'Slidev Presentation',
    description: 'Slidev starter template for creating developer-friendly presentations using Markdown',
    githubRepo: 'xKevIsDev/smack-slidev-template',
    tags: ['slidev', 'presentation', 'markdown'],
    icon: 'i-smack:slidev',
  },
  {
    name: 'Sveltekit',
    label: 'SvelteKit',
    description: 'SvelteKit starter template for building fast, efficient web applications',
    githubRepo: 'smack-sveltekit-template',
    tags: ['svelte', 'sveltekit', 'typescript'],
    icon: 'i-smack:svelte',
  },
  {
    name: 'Vanilla Vite',
    label: 'Vanilla + Vite',
    description: 'Minimal Vite starter template for vanilla JavaScript projects',
    githubRepo: 'xKevIsDev/vanilla-vite-template',
    tags: ['vite', 'vanilla-js', 'minimal'],
    icon: 'i-smack:vite',
  },
  {
    name: 'Vite React',
    label: 'React + Vite + typescript',
    description: 'React starter template powered by Vite for fast development experience',
    githubRepo: 'xKevIsDev/smack-vite-react-ts-template',
    tags: ['react', 'vite', 'frontend', 'website', 'app'],
    icon: 'i-smack:react',
  },
  {
    name: 'Vite Typescript',
    label: 'Vite + TypeScript',
    description: 'Vite starter template with TypeScript configuration for type-safe development',
    githubRepo: 'xKevIsDev/smack-vite-ts-template',
    tags: ['vite', 'typescript', 'minimal'],
    icon: 'i-smack:typescript',
  },
  {
    name: 'Vue',
    label: 'Vue.js',
    description: 'Vue.js starter template with modern tooling and best practices',
    githubRepo: 'xKevIsDev/smack-vue-template',
    tags: ['vue', 'typescript', 'frontend'],
    icon: 'i-smack:vue',
  },
  {
    name: 'Angular',
    label: 'Angular Starter',
    description: 'A modern Angular starter template with TypeScript support and best practices configuration',
    githubRepo: 'xKevIsDev/smack-angular-template',
    tags: ['angular', 'typescript', 'frontend', 'spa'],
    icon: 'i-smack:angular',
  },
  {
    name: 'SolidJS',
    label: 'SolidJS Tailwind',
    description: 'Lightweight SolidJS starter template for building fast static websites',
    githubRepo: 'xKevIsDev/solidjs-ts-tw',
    tags: ['solidjs'],
    icon: 'i-smack:solidjs',
  },
  {
    name: 'React Native',
    label: 'React Native',
    description: 'React Native template with Expo tooling for iOS and Android',
    githubRepo: 'smack-sh/react-native-template',
    tags: ['react-native', 'mobile', 'expo'],
    icon: 'i-smack:react-native',
  },
  {
    name: 'Django',
    label: 'Django',
    description: 'Django starter with REST setup and Docker dev scripts',
    githubRepo: 'smack-sh/django-template',
    tags: ['python', 'django', 'backend'],
    icon: 'i-smack:django',
  },
];
