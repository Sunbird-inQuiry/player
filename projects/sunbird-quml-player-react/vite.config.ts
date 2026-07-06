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
        //
        // The source calls PRODUCTION v2 paths (api-endpoints.ts), but the local
        // port-forwarded backend serves v5 only — so the dev proxy rewrites
        // v2 → v5 (and adds the channel header + edit-mode the v5 routes need).
        '/learner/questionset/v2/hierarchy': {
          target: 'http://localhost:9000',
          headers: { 'X-Channel-Id': '01309282781705830427' },
          rewrite: (p: string) => {
            const v5 = p.replace('/learner/questionset/v2/hierarchy', '/questionset/v5/hierarchy');
            return v5.includes('?') ? v5 : `${v5}?mode=edit`;
          },
        },
        '/api/questionset/v2/read': {
          target: 'http://localhost:9000',
          headers: { 'X-Channel-Id': '01309282781705830427' },
          rewrite: (p: string) => p.replace('/api/questionset/v2/read', '/questionset/v5/read'),
        },
        '/api/question/v2/list': {
          target: 'http://localhost:9000',
          rewrite: (p: string) => p.replace('/api/question/v2/list', '/question/v5/list'),
        },
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
