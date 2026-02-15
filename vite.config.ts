import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from '@remix-run/dev';
import UnoCSS from 'unocss/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules';
import tsconfigPaths from 'vite-tsconfig-paths';
import * as dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

function pickVendorChunk(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  const chunkRules: Array<{ name: string; markers: string[] }> = [
    {
      name: 'ui-vendor',
      markers: ['node_modules/framer-motion/', 'node_modules/chart.js/', 'node_modules/react-chartjs-2/'],
    },
    { name: 'react-vendor', markers: ['node_modules/react/', 'node_modules/react-dom/', 'node_modules/@remix-run/'] },
    { name: 'editor-vendor', markers: ['shiki', 'codemirror', '@codemirror', 'monaco'] },
    { name: 'terminal-vendor', markers: ['@xterm', 'xterm'] },
    { name: 'ai-vendor', markers: ['ai', '@ai-sdk', '@anthropic-ai', 'openai'] },
  ];

  for (const rule of chunkRules) {
    if (rule.markers.some((marker) => id.includes(marker))) {
      return rule.name;
    }
  }

  return 'vendor';
}

export default defineConfig(({ mode, command }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    global: 'globalThis',
  },

  build: {
    target: 'esnext',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      external: ['firebase-admin', 'undici'],
      output: {
        manualChunks(id) {
          return pickVendorChunk(id);
        },
      },
    },
  },

  plugins: [
    nodePolyfills({
      include: ['buffer', 'process', 'util', 'stream'],
      globals: {
        Buffer: true,
        process: true,
        global: true,
      },
      protocolImports: true,
      exclude: ['fs', 'child_process', 'path'],
    }),

    {
      name: 'buffer-env-fix',
      transform(code, id) {
        if (id.includes('env.mjs')) {
          return {
            code: `import { Buffer } from 'buffer'\n${code}`,
            map: null,
          };
        }

        return null;
      },
    },

    mode !== 'test' && command === 'serve' && remixCloudflareDevProxy(),

    ...remixVitePlugin({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: false,
      },
    }),

    UnoCSS(),
    tsconfigPaths(),
    chrome129IssuePlugin(),

    mode === 'production' &&
      optimizeCssModules({
        apply: 'build',
      }),
  ],

  optimizeDeps: {
    include: [],
    exclude: ['undici'],
  },

  resolve: {
    alias: {
      'node:util/types': resolve(__dirname, './emptyUtilTypes.js'),
      'util/types': resolve(__dirname, './emptyUtilTypes.js'),
      '~': resolve(__dirname, './app'),
      '@smack-os': resolve(__dirname, './smack-os'),
    },
  },

  ssr: {
    external: ['path-browserify'],
  },

  envPrefix: [
    'VITE_',
    'gemini_LIKE_API_BASE_URL',
    'gemini_LIKE_API_MODELS',
    'OLLAMA_API_BASE_URL',
    'LMSTUDIO_API_BASE_URL',
    'TOGETHER_API_BASE_URL',
  ],

  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
      },
    },
  },

  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      '**/tests/preview/**',
    ],
  },
}));

function chrome129IssuePlugin() {
  return {
    name: 'chrome129IssuePlugin',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers['user-agent']?.match(/Chrom(e|ium)\/([0-9]+)\./);

        if (raw && parseInt(raw[2], 10) === 129) {
          res.setHeader('content-type', 'text/html');
          res.end(`
            <body>
              <h1>Chrome 129 Dev Issue</h1>
              <p>Use Chrome Canary for local development.</p>
              <p>This does not affect production builds.</p>
            </body>
          `);

          return;
        }

        next();
      });
    },
  };
}
