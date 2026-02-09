// vite.config.ts
import { cloudflareDevProxyVitePlugin as remixCloudflareDevProxy, vitePlugin as remixVitePlugin } from "file:///home/project/node_modules/@remix-run/dev/dist/index.js";
import UnoCSS from "file:///home/project/node_modules/unocss/dist/vite.mjs";
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import { nodePolyfills } from "file:///home/project/node_modules/vite-plugin-node-polyfills/dist/index.js";
import { optimizeCssModules } from "file:///home/project/node_modules/vite-plugin-optimize-css-modules/dist/index.mjs";
import tsconfigPaths from "file:///home/project/node_modules/vite-tsconfig-paths/dist/index.mjs";
import * as dotenv from "file:///home/project/node_modules/dotenv/lib/main.js";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
var __vite_injected_original_import_meta_url = "file:///home/project/vite.config.ts";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });
dotenv.config();
var __dirname = dirname(fileURLToPath(__vite_injected_original_import_meta_url));
var vite_config_default = defineConfig(({ mode, command }) => ({
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    global: "globalThis"
  },
  build: {
    target: "esnext",
    rollupOptions: {
      external: ["firebase-admin", "undici"]
    }
  },
  plugins: [
    nodePolyfills({
      include: ["buffer", "process", "util", "stream"],
      globals: {
        Buffer: true,
        process: true,
        global: true
      },
      protocolImports: true,
      exclude: ["fs", "child_process", "path"]
    }),
    {
      name: "buffer-env-fix",
      transform(code, id) {
        if (id.includes("env.mjs")) {
          return {
            code: `import { Buffer } from 'buffer'
${code}`,
            map: null
          };
        }
        return null;
      }
    },
    mode !== "test" && command === "serve" && remixCloudflareDevProxy(),
    ...remixVitePlugin({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true
      }
    }),
    UnoCSS(),
    tsconfigPaths(),
    chrome129IssuePlugin(),
    mode === "production" && optimizeCssModules({
      apply: "build"
    })
  ],
  optimizeDeps: {
    include: []
  },
  resolve: {
    alias: {
      "util/types": resolve(__dirname, "./emptyUtilTypes.js"),
      "~": resolve(__dirname, "./app"),
      "@smack-os": resolve(__dirname, "./smack-os")
    }
  },
  ssr: {
    external: ["path-browserify"]
  },
  envPrefix: [
    "VITE_",
    "gemini_LIKE_API_BASE_URL",
    "gemini_LIKE_API_MODELS",
    "OLLAMA_API_BASE_URL",
    "LMSTUDIO_API_BASE_URL",
    "TOGETHER_API_BASE_URL"
  ],
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern-compiler"
      }
    }
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
      "**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*",
      "**/tests/preview/**"
    ]
  }
}));
function chrome129IssuePlugin() {
  return {
    name: "chrome129IssuePlugin",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const raw = req.headers["user-agent"]?.match(/Chrom(e|ium)\/([0-9]+)\./);
        if (raw && parseInt(raw[2], 10) === 129) {
          res.setHeader("content-type", "text/html");
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
    }
  };
}
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBjbG91ZGZsYXJlRGV2UHJveHlWaXRlUGx1Z2luIGFzIHJlbWl4Q2xvdWRmbGFyZURldlByb3h5LCB2aXRlUGx1Z2luIGFzIHJlbWl4Vml0ZVBsdWdpbiB9IGZyb20gJ0ByZW1peC1ydW4vZGV2J1xuaW1wb3J0IFVub0NTUyBmcm9tICd1bm9jc3Mvdml0ZSdcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgdHlwZSBWaXRlRGV2U2VydmVyIH0gZnJvbSAndml0ZSdcbmltcG9ydCB7IG5vZGVQb2x5ZmlsbHMgfSBmcm9tICd2aXRlLXBsdWdpbi1ub2RlLXBvbHlmaWxscydcbmltcG9ydCB7IG9wdGltaXplQ3NzTW9kdWxlcyB9IGZyb20gJ3ZpdGUtcGx1Z2luLW9wdGltaXplLWNzcy1tb2R1bGVzJ1xuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSAndml0ZS10c2NvbmZpZy1wYXRocydcbmltcG9ydCAqIGFzIGRvdGVudiBmcm9tICdkb3RlbnYnXG5cbmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICd1cmwnXG5pbXBvcnQgeyBkaXJuYW1lLCByZXNvbHZlIH0gZnJvbSAncGF0aCdcblxuZG90ZW52LmNvbmZpZyh7IHBhdGg6ICcuZW52LmxvY2FsJyB9KVxuZG90ZW52LmNvbmZpZyh7IHBhdGg6ICcuZW52JyB9KVxuZG90ZW52LmNvbmZpZygpXG5cbmNvbnN0IF9fZGlybmFtZSA9IGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSwgY29tbWFuZCB9KSA9PiAoe1xuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYuTk9ERV9FTlYnOiBKU09OLnN0cmluZ2lmeShwcm9jZXNzLmVudi5OT0RFX0VOViksXG4gICAgZ2xvYmFsOiAnZ2xvYmFsVGhpcycsXG4gIH0sXG5cbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlc25leHQnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGV4dGVybmFsOiBbJ2ZpcmViYXNlLWFkbWluJywgJ3VuZGljaSddLFxuICAgIH0sXG4gIH0sXG5cbiAgcGx1Z2luczogW1xuICAgIG5vZGVQb2x5ZmlsbHMoe1xuICAgICAgaW5jbHVkZTogWydidWZmZXInLCAncHJvY2VzcycsICd1dGlsJywgJ3N0cmVhbSddLFxuICAgICAgZ2xvYmFsczoge1xuICAgICAgICBCdWZmZXI6IHRydWUsXG4gICAgICAgIHByb2Nlc3M6IHRydWUsXG4gICAgICAgIGdsb2JhbDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICBwcm90b2NvbEltcG9ydHM6IHRydWUsXG4gICAgICBleGNsdWRlOiBbJ2ZzJywgJ2NoaWxkX3Byb2Nlc3MnLCAncGF0aCddLFxuICAgIH0pLFxuXG4gICAge1xuICAgICAgbmFtZTogJ2J1ZmZlci1lbnYtZml4JyxcbiAgICAgIHRyYW5zZm9ybShjb2RlLCBpZCkge1xuICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2Vudi5tanMnKSkge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjb2RlOiBgaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSAnYnVmZmVyJ1xcbiR7Y29kZX1gLFxuICAgICAgICAgICAgbWFwOiBudWxsLFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgfSxcbiAgICB9LFxuXG4gICAgbW9kZSAhPT0gJ3Rlc3QnICYmIGNvbW1hbmQgPT09ICdzZXJ2ZScgJiYgcmVtaXhDbG91ZGZsYXJlRGV2UHJveHkoKSxcblxuICAgIC4uLnJlbWl4Vml0ZVBsdWdpbih7XG4gICAgICBmdXR1cmU6IHtcbiAgICAgICAgdjNfZmV0Y2hlclBlcnNpc3Q6IHRydWUsXG4gICAgICAgIHYzX3JlbGF0aXZlU3BsYXRQYXRoOiB0cnVlLFxuICAgICAgICB2M190aHJvd0Fib3J0UmVhc29uOiB0cnVlLFxuICAgICAgICB2M19sYXp5Um91dGVEaXNjb3Zlcnk6IHRydWUsXG4gICAgICB9LFxuICAgIH0pLFxuXG4gICAgVW5vQ1NTKCksXG4gICAgdHNjb25maWdQYXRocygpLFxuICAgIGNocm9tZTEyOUlzc3VlUGx1Z2luKCksXG5cbiAgICBtb2RlID09PSAncHJvZHVjdGlvbicgJiZcbiAgICAgIG9wdGltaXplQ3NzTW9kdWxlcyh7XG4gICAgICAgIGFwcGx5OiAnYnVpbGQnLFxuICAgICAgfSksXG4gIF0sXG5cbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogW10sXG4gIH0sXG5cbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAndXRpbC90eXBlcyc6IHJlc29sdmUoX19kaXJuYW1lLCAnLi9lbXB0eVV0aWxUeXBlcy5qcycpLFxuICAgICAgJ34nOiByZXNvbHZlKF9fZGlybmFtZSwgJy4vYXBwJyksXG4gICAgICAnQHNtYWNrLW9zJzogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NtYWNrLW9zJyksXG4gICAgfSxcbiAgfSxcblxuICBzc3I6IHtcbiAgICBleHRlcm5hbDogWydwYXRoLWJyb3dzZXJpZnknXSxcbiAgfSxcblxuICBlbnZQcmVmaXg6IFtcbiAgICAnVklURV8nLFxuICAgICdnZW1pbmlfTElLRV9BUElfQkFTRV9VUkwnLFxuICAgICdnZW1pbmlfTElLRV9BUElfTU9ERUxTJyxcbiAgICAnT0xMQU1BX0FQSV9CQVNFX1VSTCcsXG4gICAgJ0xNU1RVRElPX0FQSV9CQVNFX1VSTCcsXG4gICAgJ1RPR0VUSEVSX0FQSV9CQVNFX1VSTCcsXG4gIF0sXG5cbiAgY3NzOiB7XG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Nzczoge1xuICAgICAgICBhcGk6ICdtb2Rlcm4tY29tcGlsZXInLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuXG4gIHRlc3Q6IHtcbiAgICBleGNsdWRlOiBbXG4gICAgICAnKiovbm9kZV9tb2R1bGVzLyoqJyxcbiAgICAgICcqKi9kaXN0LyoqJyxcbiAgICAgICcqKi9jeXByZXNzLyoqJyxcbiAgICAgICcqKi8ue2lkZWEsZ2l0LGNhY2hlLG91dHB1dCx0ZW1wfS8qKicsXG4gICAgICAnKiove2thcm1hLHJvbGx1cCx3ZWJwYWNrLHZpdGUsdml0ZXN0LGplc3QsYXZhLGJhYmVsLG55YyxjeXByZXNzLHRzdXAsYnVpbGR9LmNvbmZpZy4qJyxcbiAgICAgICcqKi90ZXN0cy9wcmV2aWV3LyoqJyxcbiAgICBdLFxuICB9LFxufSkpXG5cbmZ1bmN0aW9uIGNocm9tZTEyOUlzc3VlUGx1Z2luKCkge1xuICByZXR1cm4ge1xuICAgIG5hbWU6ICdjaHJvbWUxMjlJc3N1ZVBsdWdpbicsXG4gICAgY29uZmlndXJlU2VydmVyKHNlcnZlcjogVml0ZURldlNlcnZlcikge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgocmVxLCByZXMsIG5leHQpID0+IHtcbiAgICAgICAgY29uc3QgcmF3ID0gcmVxLmhlYWRlcnNbJ3VzZXItYWdlbnQnXT8ubWF0Y2goL0Nocm9tKGV8aXVtKVxcLyhbMC05XSspXFwuLylcblxuICAgICAgICBpZiAocmF3ICYmIHBhcnNlSW50KHJhd1syXSwgMTApID09PSAxMjkpIHtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdjb250ZW50LXR5cGUnLCAndGV4dC9odG1sJylcbiAgICAgICAgICByZXMuZW5kKGBcbiAgICAgICAgICAgIDxib2R5PlxuICAgICAgICAgICAgICA8aDE+Q2hyb21lIDEyOSBEZXYgSXNzdWU8L2gxPlxuICAgICAgICAgICAgICA8cD5Vc2UgQ2hyb21lIENhbmFyeSBmb3IgbG9jYWwgZGV2ZWxvcG1lbnQuPC9wPlxuICAgICAgICAgICAgICA8cD5UaGlzIGRvZXMgbm90IGFmZmVjdCBwcm9kdWN0aW9uIGJ1aWxkcy48L3A+XG4gICAgICAgICAgICA8L2JvZHk+XG4gICAgICAgICAgYClcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKVxuICAgICAgfSlcbiAgICB9LFxuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsZ0NBQWdDLHlCQUF5QixjQUFjLHVCQUF1QjtBQUNoVSxPQUFPLFlBQVk7QUFDbkIsU0FBUyxvQkFBd0M7QUFDakQsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUywwQkFBMEI7QUFDbkMsT0FBTyxtQkFBbUI7QUFDMUIsWUFBWSxZQUFZO0FBRXhCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsU0FBUyxlQUFlO0FBVGlHLElBQU0sMkNBQTJDO0FBVzVLLGNBQU8sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUM3QixjQUFPLEVBQUUsTUFBTSxPQUFPLENBQUM7QUFDdkIsY0FBTztBQUVkLElBQU0sWUFBWSxRQUFRLGNBQWMsd0NBQWUsQ0FBQztBQUV4RCxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLE1BQU0sUUFBUSxPQUFPO0FBQUEsRUFDbEQsUUFBUTtBQUFBLElBQ04sd0JBQXdCLEtBQUssVUFBVSxRQUFRLElBQUksUUFBUTtBQUFBLElBQzNELFFBQVE7QUFBQSxFQUNWO0FBQUEsRUFFQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixlQUFlO0FBQUEsTUFDYixVQUFVLENBQUMsa0JBQWtCLFFBQVE7QUFBQSxJQUN2QztBQUFBLEVBQ0Y7QUFBQSxFQUVBLFNBQVM7QUFBQSxJQUNQLGNBQWM7QUFBQSxNQUNaLFNBQVMsQ0FBQyxVQUFVLFdBQVcsUUFBUSxRQUFRO0FBQUEsTUFDL0MsU0FBUztBQUFBLFFBQ1As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
