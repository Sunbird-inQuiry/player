import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname is not available in ESM; derive it from import.meta.url
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Mode-aware config (spec §6.3):
 * - development (`vite` / `npm run dev`): dev server + API proxy for the dev
 *   harness; no `lib` build.
 * - library / web-component (`vite build`): single IIFE bundle + single CSS file
 *   from the dedicated web-component entry (NOT main.tsx).
 */
export default defineConfig(({ command }) => {
  const isBuild = command === 'build';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // ── Development mode (vite / npm run dev) ──────────────────────────────
    server: {
      port: 3000,
      proxy: {
        // Port-forward the backend to localhost:9000; these paths are proxied so
        // the browser makes same-origin relative requests (no CORS).
        '/questionset': 'http://localhost:9000',
        '/question': 'http://localhost:9000',
        '/questions': 'http://localhost:9000',
        '/api': 'http://localhost:9000',
      },
    },

    // ── Library / web-component mode (vite build) ──────────────────────────
    build: isBuild
      ? {
          outDir: 'dist',
          sourcemap: false,
          lib: {
            // Dedicated web-component entry — NOT main.tsx (§6.2).
            entry: 'src/web-component/element-registration.tsx',
            name: 'SunbirdQumlPlayer',
            fileName: () => 'sunbird-quml-player.js',
            formats: ['iife'],
          },
          rollupOptions: {
            output: {
              inlineDynamicImports: true,
            },
          },
          minify: 'terser',
          cssCodeSplit: false,
        }
      : {
          outDir: 'dist',
          sourcemap: true,
        },
  };
});
